/**
 * Reacciones de la pagina ks-bravo.com
 * ------------------------------------
 * Un contador de "me gusta" por personaje, SIN que el visitante tenga que
 * iniciar sesion ni dar ningun dato. Corre en Cloudflare Workers, en la cuenta
 * de Hector, asi que ningun tercero ve a su gente.
 *
 *   GET  /            -> { "umnidorid": 12, "pellow": 5, ... }
 *   POST /umnidorid   -> suma uno y devuelve { clave, total, yaVotaste }
 *
 * Todos los contadores viven en UNA sola clave de KV, como un JSON. Con el
 * trafico de esta pagina (unas 40 visitas por dia) eso es de sobra y hace una
 * sola lectura por pedido. La contra es que si dos personas votan en el mismo
 * segundo exacto se puede perder un voto; a esta escala no pasa, y perder un
 * "me gusta" no rompe nada.
 */

const CLAVE_TOTALES = "totales";
const MAX_PERSONAJES = 300;      // techo para que nadie infle el almacenamiento
const HORAS_ANTIREPETIDO = 24;

const ORIGENES = [
  "https://ks-bravo.com",
  "https://www.ks-bravo.com",
];

function cors(origen) {
  // Solo se responde con el origen si es uno de los nuestros; si no, no se
  // habilita el navegador de un sitio ajeno a usar esta API.
  const ok = ORIGENES.includes(origen) || /^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origen || "");
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
      // que no lo cachee nadie: el numero cambia
      "Cache-Control": "no-store",
      ...cors(origen),
    },
  });

/** Los nombres validos: minusculas, numeros y guiones. Nada mas. */
const CLAVE_OK = /^[a-z0-9-]{1,40}$/;

/** Huella corta de IP + personaje, para no contar dos veces al mismo. */
async function huella(ip, clave) {
  const datos = new TextEncoder().encode(ip + "|" + clave);
  const hash = await crypto.subtle.digest("SHA-256", datos);
  return "voto:" + [...new Uint8Array(hash)].slice(0, 12)
    .map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function leerTotales(env) {
  const crudo = await env.REACCIONES.get(CLAVE_TOTALES);
  if (!crudo) return {};
  try {
    const d = JSON.parse(crudo);
    return d && typeof d === "object" ? d : {};
  } catch {
    return {};                     // si el JSON se corrompio, se arranca limpio
  }
}

export default {
  async fetch(peticion, env) {
    const origen = peticion.headers.get("Origin") || "";
    const url = new URL(peticion.url);
    const clave = decodeURIComponent(url.pathname.replace(/^\/+|\/+$/g, ""));

    if (peticion.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors(origen) });
    }

    if (peticion.method === "GET" && clave === "") {
      return json(await leerTotales(env), origen);
    }

    if (peticion.method === "POST" && CLAVE_OK.test(clave)) {
      const ip = peticion.headers.get("CF-Connecting-IP") || "0.0.0.0";
      const marca = await huella(ip, clave);
      const totales = await leerTotales(env);

      // Ya voto desde esta conexion en las ultimas horas: se le devuelve el
      // numero actual y listo. No es un error, no hace falta avisarle nada.
      //
      // La marca solo vale si el personaje TIENE votos. Si no figura en los
      // totales es que los contadores se borraron y la marca quedo huerfana:
      // bloquear por una marca asi deja al que vota viendo un corazon vacio
      // que no reacciona. Paso de verdad al probar esto, con una marca de
      // prueba mia que le bloqueo el voto a Hector.
      if (clave in totales && await env.REACCIONES.get(marca)) {
        return json({ clave, total: totales[clave], yaVotaste: true }, origen);
      }
      // Personaje nuevo, pero ya hay demasiados: no se agrega.
      if (!(clave in totales) && Object.keys(totales).length >= MAX_PERSONAJES) {
        return json({ error: "demasiados personajes" }, origen, 429);
      }

      totales[clave] = (totales[clave] || 0) + 1;
      await env.REACCIONES.put(CLAVE_TOTALES, JSON.stringify(totales));
      await env.REACCIONES.put(marca, "1", {
        expirationTtl: HORAS_ANTIREPETIDO * 3600,
      });
      return json({ clave, total: totales[clave], yaVotaste: false }, origen);
    }

    return json({ error: "no encontrado" }, origen, 404);
  },
};
