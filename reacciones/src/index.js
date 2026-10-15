/**
 * Reacciones de la pagina ks-bravo.com
 * ------------------------------------
 * Me gusta / no me gusta por personaje, SIN que el visitante tenga que iniciar
 * sesion ni dar ningun dato. Corre en Cloudflare, en la cuenta de Hector, asi
 * que ningun tercero ve a su gente.
 *
 *   GET  /                  -> { "umnidorid": { "like": 12, "dislike": 1 }, ... }
 *   POST /umnidorid/like    -> aplica el voto y devuelve como quedo
 *   POST /umnidorid/dislike
 *
 * Cada persona tiene UN voto por personaje. Si vota lo contrario de lo que ya
 * habia votado, se cambia (se descuenta de un lado y se suma del otro); si
 * repite lo mismo, no pasa nada.
 *
 * SOLO SE VOTAN LOS PERSONAJES DE LA PAGINA
 * Antes el servicio aceptaba cualquier nombre que le mandaran, asi que
 * cualquiera podia inventar entradas. Ahora, para crear un nombre nuevo, ese
 * nombre tiene que estar en https://ks-bravo.com/progress/. La lista se lee de
 * la pagina y se refresca cada pocos minutos, de manera que un personaje
 * agregado desde el Gestor empieza a aceptar votos solo, sin tocar este
 * archivo ni volver a publicar el Worker.
 *
 * POR QUE UN DURABLE OBJECT Y NO KV
 * La primera version guardaba todo en KV. KV avisa de los cambios "cuando
 * puede": al cambiar de voto rapido, el servidor todavia no veia el voto
 * anterior, no lo descontaba, y el personaje terminaba con 1 a favor Y 1 en
 * contra de la misma persona. Paso de verdad, con Pellow.
 * Un Durable Object es un unico lugar que atiende los votos de a uno y ve
 * siempre el estado real, asi que ese cruce no puede pasar.
 */

const MAX_PERSONAJES = 300;      // techo para que nadie infle el almacenamiento
const DIAS_MEMORIA = 30;         // cuanto se recuerda el voto de cada conexion

// De donde sale la lista de personajes que existen de verdad. Se lee la propia
// pagina y se sacan las claves de los botones, asi la lista se mantiene sola:
// cuando Hector agrega un personaje en el Gestor y publica, al rato el servicio
// ya lo acepta, sin tocar este archivo ni volver a publicar el Worker.
const PAGINA = "https://ks-bravo.com/progress/";
const CLAVE_EN_PAGINA = /data-personaje="([a-z0-9-]{1,40})"/g;
// Cada cuanto se vuelve a mirar la pagina. Corto a proposito: Hector publica
// un personaje nuevo y lo prueba enseguida, asi que la lista tiene que estar
// al dia en minutos, no en horas. Igual la pagina se pide MUY de vez en cuando:
// solo cuando llega un voto de un nombre que todavia no tiene votos.
const MINUTOS_LISTA = 5;

// Limpieza de una sola vez. Cuando queda dando vueltas una clave que no es
// ningun personaje (una prueba vieja), se pone aca y se publica: se borra la
// primera vez que llega un pedido y no se vuelve a ejecutar nunca mas, porque
// queda anotado que ya se hizo. Vaciar la lista NO deshace lo borrado.
const A_BORRAR = ["zzpais"];     // resto de cuando probamos lo de los paises
const MARCA_LIMPIEZA = "limpieza:2026-09-22";

const ORIGENES = [
  "https://ks-bravo.com",
  "https://www.ks-bravo.com",
];

const TIPOS = ["like", "dislike"];
const CLAVE_OK = /^[a-z0-9-]{1,40}$/;

function cors(origen) {
  // Solo se responde con el origen si es uno de los nuestros; si no, no se
  // habilita el navegador de un sitio ajeno a usar esta API.
  const ok = ORIGENES.includes(origen) ||
    /^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origen || "");
  return {
    "Access-Control-Allow-Origin": ok ? origen : ORIGENES[0],
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

const json = (datos, origen, estado = 200) =>
  new Response(JSON.stringify(datos), {
    status: estado,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",     // el numero cambia: que no lo cachee nadie
      ...cors(origen),
    },
  });

/** Huella corta de IP + personaje, para saber si esa conexion ya voto. */
async function huella(ip, clave) {
  const datos = new TextEncoder().encode(ip + "|" + clave);
  const hash = await crypto.subtle.digest("SHA-256", datos);
  return "v:" + [...new Uint8Array(hash)].slice(0, 12)
    .map((b) => b.toString(16).padStart(2, "0")).join("");
}

const vacio = () => ({ like: 0, dislike: 0 });

/** Tolera el formato viejo, cuando cada personaje era un numero suelto. */
function normalizar(v) {
  if (typeof v === "number") return { like: v, dislike: 0 };
  if (v && typeof v === "object") {
    return { like: Number(v.like) || 0, dislike: Number(v.dislike) || 0 };
  }
  return vacio();
}

// ------------------------------------------------------------------ //
//  El Durable Object: uno solo, atiende los votos de a uno
// ------------------------------------------------------------------ //
export class Contadores {
  constructor(state) {
    this.state = state;
  }

  async totales() {
    const guardado = (await this.state.storage.get("totales")) || {};
    const salida = {};
    for (const k of Object.keys(guardado)) salida[k] = normalizar(guardado[k]);
    return salida;
  }

  /**
   * Los personajes que hoy estan en la pagina. Se guarda una copia por unos
   * minutos para no pedir la pagina en cada voto.
   *
   * Si la pagina no contesta se devuelve la copia vieja aunque este vencida, y
   * si nunca hubo copia se devuelve null. Quien llama decide: los personajes
   * que YA tienen votos siguen funcionando igual, pase lo que pase; lo unico
   * que se frena es la creacion de nombres nuevos.
   */
  async permitidas() {
    const guardado = await this.state.storage.get("permitidas");
    const fresco = guardado &&
      (Date.now() - guardado.ts) < MINUTOS_LISTA * 60000;
    if (fresco) { return new Set(guardado.claves); }

    try {
      const r = await fetch(PAGINA, {
        headers: { "User-Agent": "ksbravo-reacciones" },
        cf: { cacheTtl: 300 },
      });
      if (r.ok) {
        const texto = await r.text();
        const claves = [...new Set(
          [...texto.matchAll(CLAVE_EN_PAGINA)].map((m) => m[1]))];
        // Si la pagina viniera vacia o cambiara de forma, la expresion no
        // encuentra nada: en ese caso no se pisa la lista buena con una vacia.
        if (claves.length) {
          await this.state.storage.put("permitidas",
            { claves: claves, ts: Date.now() });
          return new Set(claves);
        }
      }
    } catch (e) { /* sin internet o pagina caida: se sigue con la copia vieja */ }

    return guardado ? new Set(guardado.claves) : null;
  }

  /** Borra de una sola vez las claves de A_BORRAR. Ver el comentario de arriba. */
  async limpiar() {
    if (!A_BORRAR.length) { return; }
    if (await this.state.storage.get(MARCA_LIMPIEZA)) { return; }
    const totales = await this.totales();
    let toco = false;
    for (const k of A_BORRAR) {
      if (k in totales) { delete totales[k]; toco = true; }
    }
    const aEscribir = { [MARCA_LIMPIEZA]: Date.now() };
    if (toco) { aEscribir.totales = totales; }
    await this.state.storage.put(aEscribir);
  }

  async fetch(peticion) {
    await this.limpiar();
    const url = new URL(peticion.url);
    const partes = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);

    if (peticion.method === "GET" && partes.length === 0) {
      return Response.json(await this.totales());
    }

    // Resumen para Hector: de donde viene la gente que participa. Sirve para
    // decidir si conviene agregar un idioma mas a la pagina. Son numeros
    // sumados, no hay nada de nadie en particular.
    if (peticion.method === "GET" && partes.length === 1 && partes[0] === "resumen") {
      const meta = (await this.state.storage.get("meta")) || {};
      return Response.json({
        votantes: meta.total || 0,
        paises: meta.paises || {},
        idiomas: meta.idiomas || {},
      });
    }

    if (peticion.method === "POST" && partes.length === 2) {
      const [clave, tipo] = partes;
      const contrario = tipo === "like" ? "dislike" : "like";
      const marca = peticion.headers.get("X-Huella");
      const totales = await this.totales();

      if (!(clave in totales) && Object.keys(totales).length >= MAX_PERSONAJES) {
        return Response.json({ error: "demasiados personajes" }, { status: 429 });
      }

      // Nombre que todavia no existe: solo se crea si esta de verdad en la
      // pagina. Antes se aceptaba cualquier cosa, y asi entro una clave de
      // prueba que no era ningun personaje. Los que ya tienen votos no pasan
      // por aca, asi que esto no puede dejar afuera a nadie real.
      if (!(clave in totales)) {
        const ok = await this.permitidas();
        // Los dos casos se contestan distinto a proposito: asi se sabe si el
        // nombre esta mal o si el problema fue que no se pudo leer la pagina.
        if (!ok) {
          return Response.json({ error: "no se pudo leer la lista de personajes" },
                               { status: 503 });
        }
        if (!ok.has(clave)) {
          return Response.json({ error: "ese personaje no esta en la pagina" },
                               { status: 403 });
        }
      }

      // El voto anterior de esta conexion. Se guarda con fecha para que caduque
      // solo, sin depender de que alguien limpie.
      const previoGuardado = await this.state.storage.get(marca);
      const vencido = previoGuardado &&
        (Date.now() - previoGuardado.ts) > DIAS_MEMORIA * 86400000;
      const previo = (previoGuardado && !vencido) ? previoGuardado.tipo : null;

      if (previo === tipo) {
        // Ya habia votado lo mismo: no se toca nada.
        return Response.json({ clave, ...totales[clave], tuVoto: tipo });
      }

      const cuenta = totales[clave] || vacio();
      if (previo === contrario) {
        cuenta[contrario] = Math.max(0, cuenta[contrario] - 1);   // cambia de opinion
      }
      cuenta[tipo] += 1;
      totales[clave] = cuenta;

      // De donde vino. Se suma UNA sola vez por persona y personaje: si despues
      // cambia de opinion no vuelve a contar, asi el resumen mide gente que
      // participa y no cantidad de clics.
      const aEscribir = { totales: totales, [marca]: { tipo: tipo, ts: Date.now() } };
      if (previo === null) {
        const meta = (await this.state.storage.get("meta")) ||
          { total: 0, paises: {}, idiomas: {} };
        const pais = peticion.headers.get("X-Pais") || "??";
        const idioma = peticion.headers.get("X-Idioma") || "??";
        meta.total = (meta.total || 0) + 1;
        meta.paises[pais] = (meta.paises[pais] || 0) + 1;
        meta.idiomas[idioma] = (meta.idiomas[idioma] || 0) + 1;
        aEscribir.meta = meta;
      }

      // Todo junto: o queda todo o no queda nada.
      await this.state.storage.put(aEscribir);
      return Response.json({ clave, ...cuenta, tuVoto: tipo });
    }

    return Response.json({ error: "no encontrado" }, { status: 404 });
  }
}

// ------------------------------------------------------------------ //
//  La puerta de entrada: valida y le pasa la pelota al Durable Object
// ------------------------------------------------------------------ //
export default {
  async fetch(peticion, env) {
    const origen = peticion.headers.get("Origin") || "";
    const url = new URL(peticion.url);
    const partes = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);

    if (peticion.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors(origen) });
    }

    const esLectura = peticion.method === "GET" && partes.length === 0;
    const esResumen = peticion.method === "GET" && partes.length === 1 &&
      partes[0] === "resumen";
    const esVoto = peticion.method === "POST" && partes.length === 2 &&
      CLAVE_OK.test(partes[0]) && TIPOS.includes(partes[1]);

    if (!esLectura && !esResumen && !esVoto) {
      return json({ error: "no encontrado" }, origen, 404);
    }

    // Un solo Durable Object para toda la pagina: asi los votos se atienden
    // uno detras de otro y nunca se pisan entre si.
    //
    // El nombre de aca abajo ES la identidad del contador: cambiarlo arranca
    // de cero, porque pasa a usar otro. Sirve para borrar todo de una (se uso
    // para limpiar los votos de prueba), pero ojo: cambiarlo por accidente
    // hace desaparecer los votos reales.
    const id = env.CONTADORES.idFromName("votos");
    const cabeceras = new Headers(peticion.headers);
    if (esVoto) {
      const ip = peticion.headers.get("CF-Connecting-IP") || "0.0.0.0";
      cabeceras.set("X-Huella", await huella(ip, partes[0]));
      // Pais que informa Cloudflare, e idioma que pide el navegador. El idioma
      // dice mas que el pais para decidir si sumar una traduccion: en Estados
      // Unidos hay mucho hispanohablante y Brasil habla portugues.
      cabeceras.set("X-Pais", (peticion.cf && peticion.cf.country) || "??");
      const acepta = peticion.headers.get("Accept-Language") || "";
      const idioma = (acepta.split(",")[0] || "").trim().slice(0, 5).toLowerCase();
      cabeceras.set("X-Idioma", /^[a-z]{2}(-[a-z]{2})?$/.test(idioma) ? idioma : "??");
    }
    const r = await env.CONTADORES.get(id).fetch(new Request(peticion.url, {
      method: peticion.method,
      headers: cabeceras,
    }));

    return json(await r.json(), origen, r.status);
  },
};
