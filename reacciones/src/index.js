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

  async fetch(peticion) {
    const url = new URL(peticion.url);
    const partes = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);

    if (peticion.method === "GET" && partes.length === 0) {
      return Response.json(await this.totales());
    }

    if (peticion.method === "POST" && partes.length === 2) {
      const [clave, tipo] = partes;
      const contrario = tipo === "like" ? "dislike" : "like";
      const marca = peticion.headers.get("X-Huella");
      const totales = await this.totales();

      if (!(clave in totales) && Object.keys(totales).length >= MAX_PERSONAJES) {
        return Response.json({ error: "demasiados personajes" }, { status: 429 });
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

      // Las dos escrituras juntas: o quedan las dos o no queda ninguna.
      await this.state.storage.put({
        totales: totales,
        [marca]: { tipo: tipo, ts: Date.now() },
      });
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
    const esVoto = peticion.method === "POST" && partes.length === 2 &&
      CLAVE_OK.test(partes[0]) && TIPOS.includes(partes[1]);

    if (!esLectura && !esVoto) {
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
    }
    const r = await env.CONTADORES.get(id).fetch(new Request(peticion.url, {
      method: peticion.method,
      headers: cabeceras,
    }));

    return json(await r.json(), origen, r.status);
  },
};
