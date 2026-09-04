/**
 * Reacciones de la pagina ks-bravo.com
 * ------------------------------------
 * Me gusta / no me gusta por personaje, SIN que el visitante tenga que iniciar
 * sesion ni dar ningun dato. Corre en Cloudflare Workers, en la cuenta de
 * Hector, asi que ningun tercero ve a su gente.
 *
 *   GET  /                  -> { "umnidorid": { "like": 12, "dislike": 1 }, ... }
 *   POST /umnidorid/like    -> aplica el voto y devuelve como quedo
 *   POST /umnidorid/dislike
 *
 * Cada persona tiene UN voto por personaje. Si vota lo contrario de lo que ya
 * habia votado, se cambia (se descuenta de un lado y se suma del otro); si
 * repite lo mismo, no pasa nada. Eso es lo que se espera de un boton asi, y
 * ademas deja el dato mas limpio para el torneo que quiere armar despues.
 *
 * Todos los contadores viven en UNA sola clave de KV, como un JSON. Con el
 * trafico de esta pagina (unas 40 visitas por dia) es de sobra y hace una sola
 * lectura por pedido. La contra es que si dos personas votan en el mismo
 * segundo exacto se puede perder un voto; a esta escala no pasa, y perder uno
 * no rompe nada.
 */

const CLAVE_TOTALES = "totales";
const MAX_PERSONAJES = 300;      // techo para que nadie infle el almacenamiento
const DIAS_MEMORIA = 30;         // cuanto se recuerda el voto de cada conexion

const ORIGENES = [
  "https://ks-bravo.com",
  "https://www.ks-bravo.com",
];

const TIPOS = ["like", "dislike"];

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

/** Los nombres validos: minusculas, numeros y guiones. Nada mas. */
const CLAVE_OK = /^[a-z0-9-]{1,40}$/;

/** Huella corta de IP + personaje, para saber si esa conexion ya voto. */
async function huella(ip, clave) {
  const datos = new TextEncoder().encode(ip + "|" + clave);
  const hash = await crypto.subtle.digest("SHA-256", datos);
  return "voto:" + [...new Uint8Array(hash)].slice(0, 12)
    .map((b) => b.toString(16).padStart(2, "0")).join("");
}

const vacio = () => ({ like: 0, dislike: 0 });

/** Normaliza lo guardado. Tolera el formato viejo, cuando era un numero suelto. */
function normalizar(v) {
  if (typeof v === "number") return { like: v, dislike: 0 };
  if (v && typeof v === "object") {
    return { like: Number(v.like) || 0, dislike: Number(v.dislike) || 0 };
  }
  return vacio();
}

async function leerTotales(env) {
  const crudo = await env.REACCIONES.get(CLAVE_TOTALES);
  if (!crudo) return {};
  try {
    const d = JSON.parse(crudo);
    if (!d || typeof d !== "object") return {};
    const salida = {};
    for (const k of Object.keys(d)) salida[k] = normalizar(d[k]);
    return salida;
  } catch {
    return {};                     // si el JSON se corrompio, se arranca limpio
  }
}

export default {
  async fetch(peticion, env) {
    const origen = peticion.headers.get("Origin") || "";
    const url = new URL(peticion.url);
    const partes = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);

    if (peticion.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors(origen) });
    }

    if (peticion.method === "GET" && partes.length === 0) {
      return json(await leerTotales(env), origen);
    }

    if (peticion.method === "POST" && partes.length === 2 &&
        CLAVE_OK.test(partes[0]) && TIPOS.includes(partes[1])) {
      const [clave, tipo] = partes;
      const contrario = tipo === "like" ? "dislike" : "like";
      const ip = peticion.headers.get("CF-Connecting-IP") || "0.0.0.0";
      const marca = await huella(ip, clave);
      const totales = await leerTotales(env);

      // Personaje nuevo, pero ya hay demasiados: no se agrega.
      if (!(clave in totales) && Object.keys(totales).length >= MAX_PERSONAJES) {
        return json({ error: "demasiados personajes" }, origen, 429);
      }

      // La marca solo vale si el personaje TIENE votos. Si no figura en los
      // totales es que los contadores se borraron y la marca quedo huerfana:
      // bloquear por una marca asi deja al que vota viendo un boton que no
      // reacciona. Paso de verdad al probar esto.
      const previo = (clave in totales) ? await env.REACCIONES.get(marca) : null;

      if (previo === tipo) {
        // Ya habia votado lo mismo: no se toca nada.
        return json({ clave, ...totales[clave], tuVoto: tipo }, origen);
      }

      const cuenta = totales[clave] || vacio();
      if (previo === contrario) {
        cuenta[contrario] = Math.max(0, cuenta[contrario] - 1);   // cambia de opinion
      }
      cuenta[tipo] += 1;
      totales[clave] = cuenta;

      await env.REACCIONES.put(CLAVE_TOTALES, JSON.stringify(totales));
      await env.REACCIONES.put(marca, tipo, {
        expirationTtl: DIAS_MEMORIA * 24 * 3600,
      });
      return json({ clave, ...cuenta, tuVoto: tipo }, origen);
    }

    return json({ error: "no encontrado" }, origen, 404);
  },
};
