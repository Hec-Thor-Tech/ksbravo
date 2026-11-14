export const NOMBRE_PROGRAMA = "Nextbot 2D Maker Web";
export const VERSION = "1.0.0";
export const DRGBASE_ID = "1560118657";
export const LADO_MAX_SPRITE = 2048;
export const LADO_MAX_ICONO = 512;
export const MAX_FRAMES = 60;
export const CLAVES_AUDIO = ["panic", "spawn", "kill", "step", "death", "idle", "attack"];
export const AUDIO_NATIVO = [".mp3", ".wav", ".ogg"];

const ENTEROS = ["fps", "salud", "velocidad", "velocidad_caminar", "aceleracion", "salto", "salto_max",
  "danio_min", "danio_max", "rango_ataque"];
const REALES = ["altura", "ataque_intervalo", "ataque_retardo", "duracion_jumpscare", "volumen"];
const BOOLEANOS = ["iluminado", "saltar", "romper_props", "escalar", "posesion", "omnisciente", "jumpscare"];

export function configBase() {
  return {
    nombre: "My Nextbot", personaje: "", firma: "", paquete: "", categoria: "2D Nextbots", autor: "",
    fps: 8, altura: 96.0, iluminado: false,
    salud: 10000, velocidad: 500, velocidad_caminar: 100, aceleracion: 800, salto: 200, saltar: true,
    salto_max: 600, puertas: "romper", romper_props: true, danio_min: 100, danio_max: 200,
    rango_ataque: 90, ataque_intervalo: 1.0, ataque_retardo: 0.15, escalar: true, posesion: true,
    omnisciente: false, faccion: "FACTION_2DNEXTBOTS", jumpscare: true, duracion_jumpscare: 1.5,
    sangre: "DONT_BLEED", volumen: 1.0, version_zip: "1.0", titulo_workshop: "",
  };
}

const ESPACIOS = /[\t\n\v\f\r\x1c-\x1f \x85\xa0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]/;

export function pyStrip(s) {
  s = String(s);
  let a = 0, b = s.length;
  while (a < b && ESPACIOS.test(s[a])) a++;
  while (b > a && ESPACIOS.test(s[b - 1])) b--;
  return s.slice(a, b);
}

function pyFloat(v) {
  if (typeof v === "number") return v;
  const t = pyStrip(v);
  if (!/^[+-]?(\d+(_\d+)*\.?(\d+(_\d+)*)?|\.\d+(_\d+)*)([eE][+-]?\d+(_\d+)*)?$/.test(t)) throw new Error("valor");
  return Number(t.replace(/_/g, ""));
}

export function aplicarValores(cfg, vals) {
  for (const [k, v] of Object.entries(vals || {})) {
    if (!(k in cfg)) continue;
    try {
      if (BOOLEANOS.includes(k)) cfg[k] = Boolean(v);
      else if (ENTEROS.includes(k)) { const n = Math.trunc(pyFloat(v)); if (!Number.isFinite(n)) throw 0; cfg[k] = n; }
      else if (REALES.includes(k)) cfg[k] = pyFloat(v);
      else cfg[k] = pyStrip(String(v));
    } catch (e) { }
  }
  return cfg;
}

export function sanitizar(texto) {
  let t = String(texto).normalize("NFKD").replace(/[^\x00-\x7f]/g, "");
  t = t.replace(/[^A-Za-z0-9_]+/g, "_").replace(/^_+|_+$/g, "").toLowerCase();
  t = t.replace(/_+/g, "_");
  return t || "nextbot";
}

export function derivados(cfg) {
  const per = sanitizar(cfg.personaje || cfg.nombre);
  const firma = pyStrip(String(cfg.firma)) ? sanitizar(cfg.firma) : "";
  return {
    per, firma,
    modelo: per + firma,
    clase: firma ? `npc_drg_2d_${firma}_${per}` : `npc_drg_2d_${per}`,
    paquete: pyStrip(String(cfg.paquete)) ? sanitizar(cfg.paquete) : `${per}_2dnextbot`,
  };
}

function partesExactas(x) {
  const dv = new DataView(new ArrayBuffer(8));
  dv.setFloat64(0, x);
  const hi = dv.getUint32(0), lo = dv.getUint32(4);
  let e = (hi >>> 20) & 0x7ff;
  let m = (BigInt(hi & 0xfffff) << 32n) | BigInt(lo);
  if (e === 0) e = 1; else m |= 1n << 52n;
  e -= 1075;
  if (e >= 0) return { n: m << BigInt(e), s: 0 };
  return { n: m * 5n ** BigInt(-e), s: -e };
}

function redondearA(n, s, q) {
  if (q >= s) return n * 10n ** BigInt(q - s);
  const div = 10n ** BigInt(s - q);
  let c = n / div;
  const r2 = (n % div) * 2n;
  if (r2 > div || (r2 === div && c % 2n === 1n)) c += 1n;
  return c;
}

function signo(x) { return x < 0 || Object.is(x, -0) ? "-" : ""; }

export function pyFixed(x, q) {
  if (!Number.isFinite(x)) return Number.isNaN(x) ? "nan" : (x < 0 ? "-inf" : "inf");
  const sg = signo(x);
  const ax = Math.abs(x);
  if (ax === 0) return sg + (q > 0 ? "0." + "0".repeat(q) : "0");
  const { n, s } = partesExactas(ax);
  const r = redondearA(n, s, q).toString().padStart(q + 1, "0");
  return sg + (q > 0 ? r.slice(0, r.length - q) + "." + r.slice(r.length - q) : r);
}

export function pyG(x, p = 6) {
  if (!Number.isFinite(x)) return Number.isNaN(x) ? "nan" : (x < 0 ? "-inf" : "inf");
  const sg = signo(x);
  const ax = Math.abs(x);
  if (ax === 0) return sg + "0";
  const { n, s } = partesExactas(ax);
  let e10 = n.toString().length - 1 - s;
  const q = p - 1 - e10;
  const r = redondearA(n, s, q);
  let dig = r.toString();
  if (dig.length > p) e10 += 1;
  if (e10 >= -4 && e10 < p) {
    let txt;
    if (q > 0) {
      const t = dig.padStart(q + 1, "0");
      txt = t.slice(0, t.length - q) + "." + t.slice(t.length - q);
      txt = txt.replace(/0+$/, "").replace(/\.$/, "");
    } else {
      txt = dig + "0".repeat(-q);
    }
    return sg + txt;
  }
  dig = dig.slice(0, p).replace(/0+$/, "");
  const mant = dig.length > 1 ? dig[0] + "." + dig.slice(1) : dig;
  const ee = Math.abs(e10).toString().padStart(2, "0");
  return sg + mant + "e" + (e10 < 0 ? "-" : "+") + ee;
}

export function pyRound(x) {
  const f = Math.floor(x);
  const d = x - f;
  if (d > 0.5) return f + 1;
  if (d < 0.5) return f;
  return f % 2 === 0 ? f : f + 1;
}

function pow2Arriba(v) { let p = 1; while (p < v) p *= 2; return p; }

export function nuevaImg(w, h) { return { w, h, d: new Uint8Array(w * h * 4) }; }

export function copiaImg(im) { return { w: im.w, h: im.h, d: new Uint8Array(im.d) }; }

export function bboxAlfa(im) {
  const { w, h, d } = im;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) {
    let fila = y * w * 4 + 3;
    for (let x = 0; x < w; x++, fila += 4) {
      if (d[fila]) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        y1 = y;
      }
    }
  }
  return x1 < 0 ? null : [x0, y0, x1 + 1, y1 + 1];
}

export function recortar(im, b) {
  const w = b[2] - b[0], h = b[3] - b[1];
  const out = nuevaImg(w, h);
  for (let y = 0; y < h; y++) {
    const sy = y + b[1];
    if (sy < 0 || sy >= im.h) continue;
    for (let x = 0; x < w; x++) {
      const sx = x + b[0];
      if (sx < 0 || sx >= im.w) continue;
      const i = (sy * im.w + sx) * 4, o = (y * w + x) * 4;
      out.d[o] = im.d[i]; out.d[o + 1] = im.d[i + 1]; out.d[o + 2] = im.d[i + 2]; out.d[o + 3] = im.d[i + 3];
    }
  }
  return out;
}

export function recortarTransparente(im) {
  const b = bboxAlfa(im);
  if (b && !(b[0] === 0 && b[1] === 0 && b[2] === im.w && b[3] === im.h)) return recortar(im, b);
  return im;
}

export function recortarGrupo(frames) {
  const grupos = new Map();
  frames.forEach((f, i) => {
    const k = f.w + "x" + f.h;
    if (!grupos.has(k)) grupos.set(k, []);
    grupos.get(k).push(i);
  });
  const salida = frames.slice();
  for (const idxs of grupos.values()) {
    const tw = frames[idxs[0]].w, th = frames[idxs[0]].h;
    let u = null;
    for (const i of idxs) {
      const b = bboxAlfa(frames[i]);
      if (b) u = u ? [Math.min(u[0], b[0]), Math.min(u[1], b[1]), Math.max(u[2], b[2]), Math.max(u[3], b[3])] : b;
    }
    if (u && !(u[0] === 0 && u[1] === 0 && u[2] === tw && u[3] === th)) {
      for (const i of idxs) salida[i] = recortar(frames[i], u);
    }
  }
  return salida;
}

function div255(v) { const t = v + 128; return ((t >> 8) + t) >> 8; }

export function pegarConMascara(dst, src, ox, oy) {
  for (let y = 0; y < src.h; y++) {
    const dy = y + oy;
    if (dy < 0 || dy >= dst.h) continue;
    for (let x = 0; x < src.w; x++) {
      const dx = x + ox;
      if (dx < 0 || dx >= dst.w) continue;
      const i = (y * src.w + x) * 4, o = (dy * dst.w + dx) * 4;
      const a = src.d[i + 3], na = 255 - a;
      for (let c = 0; c < 4; c++) dst.d[o + c] = div255(dst.d[o + c] * na + src.d[i + c] * a);
    }
  }
}

function lanczos(x) {
  if (-3.0 <= x && x < 3.0) {
    const s1 = x === 0 ? 1.0 : Math.sin(x * Math.PI) / (x * Math.PI);
    const x3 = x / 3;
    const s2 = x3 === 0 ? 1.0 : Math.sin(x3 * Math.PI) / (x3 * Math.PI);
    return s1 * s2;
  }
  return 0.0;
}

function coeficientes(inSize, in0, in1, outSize) {
  const scale = Math.fround(in1 - in0) / outSize;
  const filterscale = scale < 1.0 ? 1.0 : scale;
  const support = 3.0 * filterscale;
  const ksize = Math.ceil(support) * 2 + 1;
  const kk = new Int32Array(outSize * ksize);
  const bounds = new Int32Array(outSize * 2);
  const ss = 1.0 / filterscale;
  const tmp = new Float64Array(ksize);
  for (let xx = 0; xx < outSize; xx++) {
    const center = in0 + (xx + 0.5) * scale;
    let ww = 0.0;
    let xmin = Math.trunc(center - support + 0.5);
    if (xmin < 0) xmin = 0;
    let xmax = Math.trunc(center + support + 0.5);
    if (xmax > inSize) xmax = inSize;
    xmax -= xmin;
    for (let x = 0; x < xmax; x++) {
      const w = lanczos((x + xmin - center + 0.5) * ss);
      tmp[x] = w;
      ww += w;
    }
    for (let x = 0; x < xmax; x++) {
      let k = tmp[x];
      if (ww !== 0.0) k /= ww;
      kk[xx * ksize + x] = k < 0 ? Math.trunc(-0.5 + k * 4194304) : Math.trunc(0.5 + k * 4194304);
    }
    bounds[xx * 2] = xmin;
    bounds[xx * 2 + 1] = xmax;
  }
  return { ksize, kk, bounds };
}

function clip8(v) { const q = v >> 22; return q < 0 ? 0 : q > 255 ? 255 : q; }

function remuestrear(im, xsize, ysize, box) {
  const b = box.map(Math.fround);
  const needH = xsize !== im.w || b[0] !== 0 || b[2] !== xsize;
  const needV = ysize !== im.h || b[1] !== 0 || b[3] !== ysize;
  const H = coeficientes(im.w, b[0], b[2], xsize);
  const V = coeficientes(im.h, b[1], b[3], ysize);
  const yFirst = V.bounds[0];
  const yLast = V.bounds[ysize * 2 - 2] + V.bounds[ysize * 2 - 1];
  let fuente = im, salida = null;
  if (needH) {
    for (let i = 0; i < ysize; i++) V.bounds[i * 2] -= yFirst;
    const rows = yLast - yFirst;
    const t = nuevaImg(xsize, rows);
    for (let yy = 0; yy < rows; yy++) {
      const fila = (yy + yFirst) * im.w * 4;
      for (let xx = 0; xx < xsize; xx++) {
        const xmin = H.bounds[xx * 2], xmax = H.bounds[xx * 2 + 1], k0 = xx * H.ksize;
        let s0 = 2097152, s1 = 2097152, s2 = 2097152, s3 = 2097152;
        for (let x = 0; x < xmax; x++) {
          const k = H.kk[k0 + x], p = fila + (x + xmin) * 4;
          s0 += im.d[p] * k; s1 += im.d[p + 1] * k; s2 += im.d[p + 2] * k; s3 += im.d[p + 3] * k;
        }
        const o = (yy * xsize + xx) * 4;
        t.d[o] = clip8(s0); t.d[o + 1] = clip8(s1); t.d[o + 2] = clip8(s2); t.d[o + 3] = clip8(s3);
      }
    }
    fuente = salida = t;
  }
  if (needV) {
    const out = nuevaImg(fuente.w, ysize);
    for (let yy = 0; yy < ysize; yy++) {
      const ymin = V.bounds[yy * 2], ymax = V.bounds[yy * 2 + 1], k0 = yy * V.ksize;
      for (let xx = 0; xx < fuente.w; xx++) {
        let s0 = 2097152, s1 = 2097152, s2 = 2097152, s3 = 2097152;
        for (let y = 0; y < ymax; y++) {
          const k = V.kk[k0 + y], p = ((y + ymin) * fuente.w + xx) * 4;
          s0 += fuente.d[p] * k; s1 += fuente.d[p + 1] * k; s2 += fuente.d[p + 2] * k; s3 += fuente.d[p + 3] * k;
        }
        const o = (yy * fuente.w + xx) * 4;
        out.d[o] = clip8(s0); out.d[o + 1] = clip8(s1); out.d[o + 2] = clip8(s2); out.d[o + 3] = clip8(s3);
      }
    }
    salida = out;
  }
  return salida || copiaImg(fuente);
}

function premultiplicar(im) {
  const o = copiaImg(im), d = o.d;
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3];
    for (let c = 0; c < 3; c++) { const t = d[i + c] * a + 128; d[i + c] = ((t >> 8) + t) >> 8; }
  }
  return o;
}

function despremultiplicar(im) {
  const d = im.d;
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3];
    if (a !== 255 && a !== 0) {
      for (let c = 0; c < 3; c++) { const v = Math.floor((255 * d[i + c]) / a); d[i + c] = v > 255 ? 255 : v; }
    }
  }
  return im;
}

export function redimensionar(im, W, H) {
  if (im.w === W && im.h === H) return copiaImg(im);
  const pm = premultiplicar(im);
  let r;
  if (pm.h > pm.w * 100 && H < pm.h) {
    const a = remuestrear(pm, pm.w, H, [0, 0, pm.w, pm.h]);
    r = remuestrear(a, W, H, [0, 0, pm.w, H]);
  } else {
    r = remuestrear(pm, W, H, [0, 0, pm.w, pm.h]);
  }
  return despremultiplicar(r);
}

export function miniatura(im, tx, ty) {
  let x = Math.floor(tx), y = Math.floor(ty);
  if (x >= im.w && y >= im.h) return im;
  const aspect = im.w / im.h;
  const redondeo = (num, clave) => {
    const a = Math.floor(num), b = Math.ceil(num);
    return Math.max(clave(b) < clave(a) ? b : a, 1);
  };
  if (x / y >= aspect) x = redondeo(y * aspect, (n) => Math.abs(aspect - n / y));
  else y = redondeo(x / aspect, (n) => (n === 0 ? 0 : Math.abs(aspect - x / n)));
  if (im.w === x && im.h === y) return im;
  return redimensionar(im, x, y);
}

export function encuadrarPow2(frames, ladoMax = LADO_MAX_SPRITE) {
  frames = recortarGrupo(frames);
  const w = Math.max(...frames.map((f) => f.w));
  const h = Math.max(...frames.map((f) => f.h));
  let lado = pow2Arriba(Math.max(w, h));
  let escala = 1.0;
  if (lado > ladoMax) {
    escala = ladoMax / Math.max(w, h);
    lado = ladoMax;
  }
  const listos = frames.map((f0) => {
    let f = f0;
    if (escala !== 1.0) f = redimensionar(f, Math.max(1, pyRound(f.w * escala)), Math.max(1, pyRound(f.h * escala)));
    const lienzo = nuevaImg(lado, lado);
    pegarConMascara(lienzo, f, Math.floor((lado - f.w) / 2), lado - f.h);
    return lienzo;
  });
  return { listos, lado, alto: pyRound(h * escala), ancho: pyRound(w * escala) };
}

export function quitarFondoLiso(img, tolerancia = 32) {
  const { w, h, d } = img;
  let minA = 255;
  for (let i = 3; i < d.length; i += 4) if (d[i] < minA) minA = d[i];
  if (minA < 250) return { img, tocada: false };
  const borde = [];
  const px = (x, y) => (y * w + x) * 4;
  for (let x = 0; x < w; x++) { borde.push(px(x, 0)); borde.push(px(x, h - 1)); }
  for (let y = 0; y < h; y++) { borde.push(px(0, y)); borde.push(px(w - 1, y)); }
  const cuenta = new Map();
  for (const i of borde) {
    const k = ((d[i] >> 4) << 8 | (d[i + 1] >> 4)) << 8 | (d[i + 2] >> 4);
    cuenta.set(k, (cuenta.get(k) || 0) + 1);
  }
  const orden = Array.from(cuenta.entries()).sort((a, b) => b[1] - a[1]);
  const grupos = [];
  for (const [k, veces] of orden) {
    const r = ((k >> 16) & 255) * 16 + 8, g = ((k >> 8) & 255) * 16 + 8, b = (k & 255) * 16 + 8;
    let unido = false;
    for (const gr of grupos) {
      if (Math.abs(gr[0] - r) + Math.abs(gr[1] - g) + Math.abs(gr[2] - b) <= tolerancia + 16) {
        gr[3] += veces;
        unido = true;
        break;
      }
    }
    if (!unido) grupos.push([r, g, b, veces]);
  }
  const fondos = grupos.filter((gr) => gr[3] >= borde.length * 0.15);
  if (fondos.reduce((s, gr) => s + gr[3], 0) < borde.length * 0.4) return { img, tocada: false };
  let borrados = 0;
  for (const [r0, g0, b0] of fondos) {
    const visto = new Uint8Array(w * h);
    let todo = new Int32Array(Math.max(64, (w + h) * 8));
    let tope = 0;
    for (let x = 0; x < w; x++) { todo[tope++] = x; todo[tope++] = 0; todo[tope++] = x; todo[tope++] = h - 1; }
    for (let y = 0; y < h; y++) { todo[tope++] = 0; todo[tope++] = y; todo[tope++] = w - 1; todo[tope++] = y; }
    while (tope > 0) {
      const y = todo[--tope], x = todo[--tope];
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      const i = y * w + x;
      if (visto[i]) continue;
      visto[i] = 1;
      const p = i * 4;
      if (d[p + 3] !== 0) {
        if (Math.abs(d[p] - r0) + Math.abs(d[p + 1] - g0) + Math.abs(d[p + 2] - b0) > tolerancia) continue;
        d[p + 3] = 0;
        borrados++;
      }
      if (tope + 8 > todo.length) { const t = new Int32Array(todo.length * 2); t.set(todo); todo = t; }
      todo[tope++] = x + 1; todo[tope++] = y;
      todo[tope++] = x - 1; todo[tope++] = y;
      todo[tope++] = x; todo[tope++] = y + 1;
      todo[tope++] = x; todo[tope++] = y - 1;
    }
  }
  return { img, tocada: borrados > Math.floor((w * h) / 100) };
}

export function generarIcono(fuente) {
  let im = recortarTransparente(fuente);
  im = miniatura(im, LADO_MAX_ICONO - 16, LADO_MAX_ICONO - 16);
  const lienzo = nuevaImg(LADO_MAX_ICONO, LADO_MAX_ICONO);
  pegarConMascara(lienzo, im, Math.floor((LADO_MAX_ICONO - im.w) / 2), Math.floor((LADO_MAX_ICONO - im.h) / 2));
  return lienzo;
}

const TABLA_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(datos, crc = 0) {
  let c = (crc ^ 0xffffffff) >>> 0;
  for (let i = 0; i < datos.length; i++) c = TABLA_CRC[(c ^ datos[i]) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

async function porStream(datos, stream) {
  const r = new Blob([datos]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(r).arrayBuffer());
}

export const comprimirZlib = (d) => porStream(d, new CompressionStream("deflate"));
export const comprimirCrudo = (d) => porStream(d, new CompressionStream("deflate-raw"));

async function descomprimirZlib(d) {
  const ds = new DecompressionStream("deflate");
  const w = ds.writable.getWriter();
  w.write(d).catch(() => { });
  w.close().catch(() => { });
  const r = ds.readable.getReader();
  const partes = [];
  let total = 0;
  try {
    for (;;) {
      const { value, done } = await r.read();
      if (done) break;
      partes.push(value);
      total += value.length;
    }
  } catch (e) { }
  const out = new Uint8Array(total);
  let o = 0;
  for (const p of partes) { out.set(p, o); o += p.length; }
  return out;
}

function u32(b, o) { return ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0; }
function u16(b, o) { return (b[o] << 8) | b[o + 1]; }

function chunkPng(tipo, datos) {
  const out = new Uint8Array(12 + datos.length);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, datos.length);
  for (let i = 0; i < 4; i++) out[4 + i] = tipo.charCodeAt(i);
  out.set(datos, 8);
  dv.setUint32(8 + datos.length, crc32(out.subarray(4, 8 + datos.length)));
  return out;
}

function paeth(a, b, c) {
  const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

export async function codificarPng(im) {
  const { w, h, d } = im;
  const fila = w * 4;
  const crudo = new Uint8Array((fila + 1) * h);
  const cand = [0, 1, 2, 3, 4].map(() => new Uint8Array(fila));
  for (let y = 0; y < h; y++) {
    const ac = y * fila, an = (y - 1) * fila;
    let mejor = 0, mejorSuma = Infinity;
    for (let f = 0; f < 5; f++) {
      const c = cand[f];
      let suma = 0;
      for (let i = 0; i < fila; i++) {
        const x = d[ac + i];
        const a = i >= 4 ? d[ac + i - 4] : 0;
        const b = y > 0 ? d[an + i] : 0;
        const cc = y > 0 && i >= 4 ? d[an + i - 4] : 0;
        let v;
        if (f === 0) v = x;
        else if (f === 1) v = x - a;
        else if (f === 2) v = x - b;
        else if (f === 3) v = x - ((a + b) >> 1);
        else v = x - paeth(a, b, cc);
        v &= 255;
        c[i] = v;
        suma += v < 128 ? v : 256 - v;
        if (suma >= mejorSuma) break;
      }
      if (suma < mejorSuma) { mejorSuma = suma; mejor = f; }
    }
    if (mejor !== 4) {
      const c = cand[mejor];
      for (let i = 0; i < fila; i++) {
        const x = d[ac + i];
        const a = i >= 4 ? d[ac + i - 4] : 0;
        const b = y > 0 ? d[an + i] : 0;
        const cc = y > 0 && i >= 4 ? d[an + i - 4] : 0;
        let v;
        if (mejor === 0) v = x;
        else if (mejor === 1) v = x - a;
        else if (mejor === 2) v = x - b;
        else if (mejor === 3) v = x - ((a + b) >> 1);
        else v = x - paeth(a, b, cc);
        c[i] = v & 255;
      }
    } else {
      const c = cand[4];
      for (let i = 0; i < fila; i++) {
        const a = i >= 4 ? d[ac + i - 4] : 0;
        const b = y > 0 ? d[an + i] : 0;
        const cc = y > 0 && i >= 4 ? d[an + i - 4] : 0;
        c[i] = (d[ac + i] - paeth(a, b, cc)) & 255;
      }
    }
    crudo[y * (fila + 1)] = mejor;
    crudo.set(cand[mejor], y * (fila + 1) + 1);
  }
  const ihdr = new Uint8Array(13);
  const dv = new DataView(ihdr.buffer);
  dv.setUint32(0, w); dv.setUint32(4, h);
  ihdr[8] = 8; ihdr[9] = 6;
  const partes = [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), chunkPng("IHDR", ihdr),
    chunkPng("IDAT", await comprimirZlib(crudo)), chunkPng("IEND", new Uint8Array(0))];
  return unir(partes);
}

function unir(partes) {
  const total = partes.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const p of partes) { out.set(p, o); o += p.length; }
  return out;
}

const MODOS_PNG = {
  "1,0": ["1", 1], "2,0": ["L", 1], "4,0": ["L", 1], "8,0": ["L", 1], "16,0": ["I;16", 1],
  "8,2": ["RGB", 3], "16,2": ["RGB", 3], "1,3": ["P", 1], "2,3": ["P", 1], "4,3": ["P", 1], "8,3": ["P", 1],
  "8,4": ["LA", 2], "16,4": ["RGBA", 2], "8,6": ["RGBA", 4], "16,6": ["RGBA", 4],
};

function desfiltrar(datos, w, h, bpp, bitsFila) {
  const fila = Math.ceil(bitsFila / 8);
  const out = new Uint8Array(fila * h);
  let p = 0;
  for (let y = 0; y < h; y++) {
    const f = datos[p++];
    const o = y * fila, an = o - fila;
    for (let i = 0; i < fila; i++) {
      const x = p < datos.length ? datos[p] : 0;
      p++;
      const a = i >= bpp ? out[o + i - bpp] : 0;
      const b = y > 0 ? out[an + i] : 0;
      const c = y > 0 && i >= bpp ? out[an + i - bpp] : 0;
      let v;
      if (f === 1) v = x + a;
      else if (f === 2) v = x + b;
      else if (f === 3) v = x + ((a + b) >> 1);
      else if (f === 4) v = x + paeth(a, b, c);
      else v = x;
      out[o + i] = v & 255;
    }
  }
  return { out, fila, usados: p };
}

function leerMuestras(fila, off, w, prof, canales) {
  const n = w * canales;
  const s = new Uint16Array(n);
  if (prof === 8) for (let i = 0; i < n; i++) s[i] = fila[off + i];
  else if (prof === 16) for (let i = 0; i < n; i++) s[i] = (fila[off + i * 2] << 8) | fila[off + i * 2 + 1];
  else {
    const por = 8 / prof, mask = (1 << prof) - 1;
    for (let i = 0; i < n; i++) {
      const byte = fila[off + Math.floor(i / por)];
      s[i] = (byte >> (8 - prof * ((i % por) + 1))) & mask;
    }
  }
  return s;
}

function ponerFila(lienzo, o, s, n, modo, prof, tipo, canales, paso) {
  for (let x = 0; x < n; x++, o += paso * 4) {
    const i = x * canales;
    let a = 0, b = 0, c = 0, d = 0;
    if (modo === "1") a = s[i] ? 255 : 0;
    else if (modo === "L") a = prof === 2 ? s[i] * 85 : prof === 4 ? s[i] * 17 : s[i];
    else if (modo === "I;16" || modo === "P") a = s[i];
    else if (modo === "RGB") { if (prof === 16) { a = s[i] >> 8; b = s[i + 1] >> 8; c = s[i + 2] >> 8; } else { a = s[i]; b = s[i + 1]; c = s[i + 2]; } d = 255; }
    else if (modo === "LA") { a = b = c = s[i]; d = s[i + 1]; }
    else if (tipo === 4) { a = b = c = s[i] >> 8; d = s[i + 1] >> 8; }
    else if (prof === 16) { a = s[i] >> 8; b = s[i + 1] >> 8; c = s[i + 2] >> 8; d = s[i + 3] >> 8; }
    else { a = s[i]; b = s[i + 1]; c = s[i + 2]; d = s[i + 3]; }
    lienzo[o] = a; lienzo[o + 1] = b; lienzo[o + 2] = c; lienzo[o + 3] = d;
  }
}

function decodificarRegion(datos, w, h, prof, tipo, entrelazado, modo, canales, lienzo, cw, ox, oy) {
  const bpp = Math.max(1, Math.ceil((prof * canales) / 8));
  if (!entrelazado) {
    const { out, fila } = desfiltrar(datos, w, h, bpp, w * prof * canales);
    for (let y = 0; y < h; y++) {
      const s = leerMuestras(out, y * fila, w, prof, canales);
      ponerFila(lienzo, ((y + oy) * cw + ox) * 4, s, w, modo, prof, tipo, canales, 1);
    }
    return;
  }
  const pasos = [[0, 0, 8, 8], [4, 0, 8, 8], [0, 4, 4, 8], [2, 0, 4, 4], [0, 2, 2, 4], [1, 0, 2, 2], [0, 1, 1, 2]];
  let p = 0;
  for (const [x0, y0, dx, dy] of pasos) {
    const pw = Math.ceil((w - x0) / dx), ph = Math.ceil((h - y0) / dy);
    if (pw <= 0 || ph <= 0) continue;
    const { out, fila, usados } = desfiltrar(datos.subarray(p), pw, ph, bpp, pw * prof * canales);
    p += usados;
    for (let y = 0; y < ph; y++) {
      const s = leerMuestras(out, y * fila, pw, prof, canales);
      ponerFila(lienzo, ((y0 + y * dy + oy) * cw + x0 + ox) * 4, s, pw, modo, prof, tipo, canales, dx);
    }
  }
}

function convertirNativo(modo, lienzo, w, h, paleta, transp) {
  const im = nuevaImg(w, h);
  const d = im.d;
  for (let i = 0, n = w * h; i < n; i++) {
    const o = i * 4;
    let r, g, b, a = 255;
    if (modo === "P") {
      const k = lienzo[o];
      if (paleta && k * 3 + 3 <= paleta.length) { r = paleta[k * 3]; g = paleta[k * 3 + 1]; b = paleta[k * 3 + 2]; }
      else { r = g = b = 0; }
      if (transp && transp.alfas && k < transp.alfas.length) a = transp.alfas[k];
    } else if (modo === "1" || modo === "L" || modo === "I;16") {
      let v = lienzo[o];
      if (modo === "I;16") v = v < 256 ? v : 255;
      r = g = b = v;
      if (transp && transp.gris !== undefined && v === (transp.gris & 255)) a = 0;
    } else if (modo === "RGB") {
      r = lienzo[o]; g = lienzo[o + 1]; b = lienzo[o + 2];
      if (transp && transp.rgb && r === (transp.rgb[0] & 255) && g === (transp.rgb[1] & 255) && b === (transp.rgb[2] & 255)) a = 0;
    } else {
      r = lienzo[o]; g = lienzo[o + 1]; b = lienzo[o + 2]; a = lienzo[o + 3];
    }
    d[o] = r; d[o + 1] = g; d[o + 2] = b; d[o + 3] = a;
  }
  return im;
}

function alfaNativa(modo, lienzo, i, paleta, transp) {
  const px = convertirNativo(modo, lienzo.subarray(i * 4, i * 4 + 4), 1, 1, paleta, transp);
  return px.d[3];
}

export async function decodificarPng(bytes, maxFrames = MAX_FRAMES) {
  const firma = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let i = 0; i < 8; i++) if (bytes[i] !== firma[i]) throw new Error("png");
  let p = 8;
  let w = 0, h = 0, prof = 8, tipo = 6, entrelazado = 0, paleta = null, trns = null, nFrames = null;
  const frames = [];
  let actual = null, idat = [], vioIdat = false, defecto = false;
  while (p + 8 <= bytes.length) {
    const len = u32(bytes, p);
    const id = String.fromCharCode(bytes[p + 4], bytes[p + 5], bytes[p + 6], bytes[p + 7]);
    const datos = bytes.subarray(p + 8, p + 8 + len);
    p += 12 + len;
    if (id === "IHDR") { w = u32(datos, 0); h = u32(datos, 4); prof = datos[8]; tipo = datos[9]; entrelazado = datos[12]; }
    else if (id === "PLTE") paleta = datos.slice();
    else if (id === "tRNS") trns = datos.slice();
    else if (id === "acTL" && !vioIdat) {
      const n = u32(datos, 0);
      if (nFrames === null && n !== 0 && n <= 0x80000000) nFrames = n; else nFrames = null;
    }
    else if (id === "fcTL") {
      if (actual) frames.push(actual);
      const fw = u32(datos, 4), fh = u32(datos, 8), fx = u32(datos, 12), fy = u32(datos, 16);
      actual = { caja: [fx, fy, fx + fw, fy + fh], disp: datos[24], blend: datos[25], datos: [] };
    }
    else if (id === "IDAT") {
      if (!vioIdat) {
        vioIdat = true;
        if (!actual) { defecto = true; actual = { caja: null, disp: null, blend: null, datos: [] }; }
      }
      actual.datos.push(datos);
    }
    else if (id === "fdAT") { if (actual) actual.datos.push(datos.subarray(4)); }
    else if (id === "IEND") break;
  }
  if (actual) frames.push(actual);
  const [modo, canales] = MODOS_PNG[prof + "," + tipo] || ["RGBA", 4];
  let transp = null;
  if (trns) {
    if (modo === "P") transp = { alfas: trns };
    else if (modo === "1") transp = { gris: u16(trns, 0) ? 255 : 0 };
    else if (modo === "L" || modo === "I;16") transp = { gris: u16(trns, 0) };
    else if (modo === "RGB") transp = { rgb: [u16(trns, 0), u16(trns, 2), u16(trns, 4)] };
  }
  let total = nFrames === null ? 1 : nFrames + (defecto ? 1 : 0);
  if (nFrames === null) frames.length = Math.min(frames.length, 1);
  const animado = total > 1;
  const cuantos = Math.min(animado ? maxFrames : 1, total, frames.length);
  const salida = [];
  const lienzo = new Uint16Array(w * h * 4);
  let previo = null, dispose = null, disposeCaja = null;
  for (let f = 0; f < cuantos; f++) {
    const fr = frames[f];
    const caja = fr.caja || [0, 0, w, h];
    let dispOp = fr.disp, blendOp = fr.blend;
    if (f > 0) {
      if (dispose) {
        for (let y = disposeCaja[1]; y < disposeCaja[3]; y++) for (let x = disposeCaja[0]; x < disposeCaja[2]; x++) {
          const o = (y * w + x) * 4, s = ((y - disposeCaja[1]) * (disposeCaja[2] - disposeCaja[0]) + (x - disposeCaja[0])) * 4;
          for (let c = 0; c < 4; c++) lienzo[o + c] = dispose[s + c];
        }
      }
      previo = lienzo.slice();
    }
    disposeCaja = caja;
    if (previo === null && dispOp === 2) dispOp = 1;
    dispose = null;
    const cw = caja[2] - caja[0], ch = caja[3] - caja[1];
    if (dispOp === 2 && previo) {
      dispose = new Uint16Array(cw * ch * 4);
      for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
        const o = ((y + caja[1]) * w + x + caja[0]) * 4, s = (y * cw + x) * 4;
        for (let c = 0; c < 4; c++) dispose[s + c] = previo[o + c];
      }
    } else if (dispOp === 1) {
      dispose = new Uint16Array(cw * ch * 4);
    }
    const crudo = await descomprimirZlib(unir(fr.datos));
    decodificarRegion(crudo, cw, ch, prof, tipo, entrelazado, modo, canales, lienzo, w, caja[0], caja[1]);
    if (previo && blendOp === 1) {
      const ocho = modo === "P" || modo === "L" || modo === "1" || modo === "I;16";
      for (let y = caja[1]; y < caja[3]; y++) for (let x = caja[0]; x < caja[2]; x++) {
        const i = y * w + x, o = i * 4;
        const a = alfaNativa(modo, lienzo, i, paleta, transp), na = 255 - a;
        const n = ocho ? 1 : 4;
        for (let c = 0; c < n; c++) previo[o + c] = div255(previo[o + c] * na + lienzo[o + c] * a);
      }
      lienzo.set(previo);
    }
    salida.push(convertirNativo(modo, lienzo, w, h, paleta, transp));
  }
  return { frames: salida, animado };
}

function paletaNecesaria(p) {
  for (let i = 0; i < p.length; i += 3) if (!(i / 3 === p[i] && p[i] === p[i + 1] && p[i + 1] === p[i + 2])) return true;
  return false;
}

function lzw(datos, bitsIni, escribir) {
  if (bitsIni < 0 || bitsIni > 12) return;
  const clear = 1 << bitsIni, eoi = clear + 1;
  const prefijo = new Int32Array(4096), sufijo = new Uint8Array(4096), largo = new Int32Array(4096);
  for (let i = 0; i < clear; i++) { prefijo[i] = -1; sufijo[i] = i; largo[i] = 1; }
  let tam = bitsIni + 1, sig = clear + 2, prev = -1;
  let acc = 0, nb = 0, pos = 0;
  const pila = new Uint8Array(4097);
  const emitir = (c) => {
    let n = largo[c], k = c;
    for (let i = n - 1; i >= 0; i--) { pila[i] = sufijo[k]; k = prefijo[k]; }
    for (let i = 0; i < n; i++) if (!escribir(pila[i])) return false;
    return true;
  };
  const primero = (c) => { let k = c; while (prefijo[k] >= 0) k = prefijo[k]; return sufijo[k]; };
  for (;;) {
    while (nb < tam) {
      if (pos >= datos.length) return;
      acc |= datos[pos++] << nb;
      nb += 8;
    }
    const code = acc & ((1 << tam) - 1);
    acc >>>= tam;
    nb -= tam;
    if (code === clear) { tam = bitsIni + 1; sig = clear + 2; prev = -1; continue; }
    if (code === eoi) return;
    if (prev === -1) {
      if (code >= clear) return;
      if (!emitir(code)) return;
      prev = code;
      continue;
    }
    let nuevo;
    if (code < sig) {
      if (!emitir(code)) return;
      nuevo = primero(code);
    } else if (code === sig) {
      nuevo = primero(prev);
      if (sig < 4096) { prefijo[sig] = prev; sufijo[sig] = nuevo; largo[sig] = largo[prev] + 1; }
      if (!emitir(sig)) return;
      sig = Math.min(sig + 1, 4096);
      if (sig === 1 << tam && tam < 12) tam++;
      prev = code;
      continue;
    } else return;
    if (sig < 4096) {
      prefijo[sig] = prev; sufijo[sig] = nuevo; largo[sig] = largo[prev] + 1;
      sig++;
      if (sig === 1 << tam && tam < 12) tam++;
    }
    prev = code;
  }
}

export function decodificarGif(bytes, maxFrames = MAX_FRAMES) {
  if (String.fromCharCode(...bytes.subarray(0, 3)) !== "GIF") throw new Error("gif");
  let W = bytes[6] | (bytes[7] << 8), H = bytes[8] | (bytes[9] << 8);
  const flags = bytes[10];
  let p = 13;
  let paletaGlobal = null;
  const info = {};
  if (flags & 128) {
    info.background = bytes[11];
    const n = 3 << ((flags & 7) + 1);
    const pal = bytes.subarray(p, p + n);
    p += n;
    if (paletaNecesaria(pal)) paletaGlobal = pal;
  }
  const leerBloques = () => {
    const partes = [];
    while (p < bytes.length) {
      const n = bytes[p++];
      if (!n) break;
      partes.push(bytes.subarray(p, p + n));
      p += n;
    }
    return partes;
  };
  const descriptores = [];
  let metodo = 0;
  for (;;) {
    let transpF = null, pal = undefined, region = null, entre = false, bitsLzw = 0, datos = null;
    let encontrado = false;
    while (p < bytes.length) {
      const s = bytes[p++];
      if (s === 0x3b) break;
      if (s === 0x21) {
        const etiqueta = bytes[p++];
        const bloques = leerBloques();
        if (etiqueta === 249 && bloques.length) {
          const b = bloques[0];
          if (b[0] & 1) transpF = b[3];
          const disp = (b[0] & 0b00011100) >> 2;
          if (disp) metodo = disp;
        }
        continue;
      }
      if (s === 0x2c) {
        const x0 = bytes[p] | (bytes[p + 1] << 8), y0 = bytes[p + 2] | (bytes[p + 3] << 8);
        const fw = bytes[p + 4] | (bytes[p + 5] << 8), fh = bytes[p + 6] | (bytes[p + 7] << 8);
        const fl = bytes[p + 8];
        p += 9;
        region = [x0, y0, x0 + fw, y0 + fh];
        entre = (fl & 64) !== 0;
        if (fl & 128) {
          const n = 3 << ((fl & 7) + 1);
          const lp = bytes.subarray(p, p + n);
          p += n;
          pal = paletaNecesaria(lp) ? lp : false;
        }
        bitsLzw = bytes[p++];
        datos = unir(leerBloques());
        encontrado = true;
        break;
      }
    }
    if (!encontrado) break;
    descriptores.push({ transpF, pal, region, entre, bitsLzw, datos, metodo });
    if (descriptores.length > maxFrames) break;
  }
  if (!descriptores.length) throw new Error("gif");
  const animado = descriptores.length > 1;
  const cuantos = animado ? Math.min(maxFrames, descriptores.length) : 1;
  let modo = null, im = null, paletaImg = null, dispose = null, disposeCaja = null;
  const salida = [];
  const rgbDe = (color, paletaF) => {
    if (paletaF) {
      if (color * 3 + 3 > paletaF.length) color = 0;
      return [paletaF[color * 3], paletaF[color * 3 + 1], paletaF[color * 3 + 2]];
    }
    return [color, color, color];
  };
  const p2rgba = (indices, paletaP, transpIdx, conAlfa) => {
    const out = new Uint8Array(indices.length * 4);
    for (let i = 0; i < indices.length; i++) {
      const k = indices[i];
      if (paletaP && k * 3 + 3 <= paletaP.length) { out[i * 4] = paletaP[k * 3]; out[i * 4 + 1] = paletaP[k * 3 + 1]; out[i * 4 + 2] = paletaP[k * 3 + 2]; }
      out[i * 4 + 3] = conAlfa && k === transpIdx ? 0 : 255;
    }
    return out;
  };
  const l2rgba = (indices, transpIdx) => {
    const out = new Uint8Array(indices.length * 4);
    for (let i = 0; i < indices.length; i++) {
      const v = indices[i];
      out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = v;
      out[i * 4 + 3] = transpIdx !== undefined && transpIdx !== null && v === transpIdx ? 0 : 255;
    }
    return out;
  };
  const expandir = (arr, ow, oh, nw, nh, canales) => {
    const out = new Uint8Array(nw * nh * canales);
    for (let y = 0; y < oh; y++) out.set(arr.subarray(y * ow * canales, (y + 1) * ow * canales), y * nw * canales);
    return out;
  };
  for (let f = 0; f < cuantos; f++) {
    const D = descriptores[f];
    const [x0, y0, x1, y1] = D.region;
    const oW = W, oH = H;
    if (x1 > W || y1 > H) { W = Math.max(x1, W); H = Math.max(y1, H); }
    const canalesIm = modo === "RGB" || modo === "RGBA" ? 4 : 1;
    if (dispose && im) {
      const [a0, b0, a1, b1] = disposeCaja;
      for (let y = b0; y < b1; y++) for (let x = a0; x < a1; x++) {
        if (x >= oW || y >= oH) continue;
        const s = ((y - b0) * (a1 - a0) + (x - a0)) * dispose.canales;
        const o = (y * oW + x) * canalesIm;
        if (canalesIm === 1) im[o] = dispose.d[s];
        else for (let c = 0; c < 4; c++) im[o + c] = dispose.canales === 4 ? dispose.d[s + c] : c === 3 ? 255 : dispose.d[s];
      }
    }
    const paletaF = D.pal !== undefined ? D.pal : paletaGlobal;
    if (f === 0) {
      modo = paletaF ? "P" : "L";
      paletaImg = D.pal ? D.pal : paletaGlobal ? paletaGlobal : null;
    } else if (modo === "P") {
      if ("transparency" in info) {
        im = p2rgba(im, paletaImg, info.transparency, true);
        modo = "RGBA";
        delete info.transparency;
      } else {
        im = p2rgba(im, paletaImg, -1, false);
        modo = "RGB";
      }
    }
    dispose = null;
    disposeCaja = [x0, y0, x1, y1];
    const dw = x1 - x0, dh = y1 - y0;
    const metodo = D.metodo;
    const esRgb = modo === "RGB" || modo === "RGBA";
    if (metodo >= 2) {
      if (metodo === 2) {
        let color = "transparency" in info ? info.transparency : D.transpF;
        if (color !== null && color !== undefined) {
          if (esRgb) { const c = rgbDe(color, paletaF); dispose = { canales: 4, d: llenar(dw * dh, 4, [c[0], c[1], c[2], 0]) }; }
          else dispose = { canales: 1, d: llenar(dw * dh, 1, [color]) };
        } else {
          color = info.background !== undefined ? info.background : 0;
          if (esRgb) { const c = rgbDe(color, paletaF); dispose = { canales: 4, d: llenar(dw * dh, 4, [c[0], c[1], c[2], 255]) }; }
          else dispose = { canales: 1, d: llenar(dw * dh, 1, [color]) };
        }
      } else if (im) {
        const can = esRgb ? 4 : 1;
        const d = new Uint8Array(dw * dh * can);
        for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) {
          const sx = x + x0, sy = y + y0;
          if (sx >= oW || sy >= oH) continue;
          for (let c = 0; c < can; c++) d[(y * dw + x) * can + c] = im[(sy * oW + sx) * can + c];
        }
        dispose = { canales: can, d };
      } else if (D.transpF !== null) {
        if (esRgb) { const c = rgbDe(D.transpF, paletaF); dispose = { canales: 4, d: llenar(dw * dh, 4, [c[0], c[1], c[2], 0]) }; }
        else dispose = { canales: 1, d: llenar(dw * dh, 1, [D.transpF]) };
      }
    }
    let transTile = -1;
    if (D.transpF !== null) {
      if (f === 0) info.transparency = D.transpF;
      else if (!esRgb) transTile = D.transpF;
    }
    let previo = null, pW = oW, pH = oH;
    let tmp;
    if (f === 0) {
      tmp = new Uint8Array(W * H);
      if (D.transpF !== null) tmp.fill(D.transpF);
    } else if (esRgb) {
      previo = im;
      tmp = new Uint8Array(W * H);
      if (paletaF) tmp.fill(D.transpF || 0);
    } else {
      tmp = im;
      if (oW !== W || oH !== H) tmp = expandir(im, oW, oH, W, H, 1);
    }
    let x = 0, y = 0, paso = D.entre ? 8 : 1, pase = D.entre ? 1 : 0;
    const rw = dw, rh = dh;
    let vivo = rh > 0 && rw > 0;
    lzw(D.datos, D.bitsLzw, (c) => {
      if (!vivo) return false;
      if (c !== transTile) {
        const gx = x + x0, gy = y + y0;
        if (gx < W && gy < H) tmp[gy * W + gx] = c;
      }
      x++;
      if (x >= rw) {
        x = 0;
        y += paso;
        while (y >= rh) {
          if (pase === 1) { y = 4; pase = 2; }
          else if (pase === 2) { paso = 4; y = 2; pase = 3; }
          else if (pase === 3) { paso = 2; y = 1; pase = 0; }
          else { vivo = false; return false; }
        }
      }
      return true;
    });
    if (f === 0 || !previo) {
      im = tmp;
    } else {
      let base = previo;
      if (pW !== W || pH !== H) {
        if (D.transpF !== null) base = expandir(previo, pW, pH, W, H, 4);
        else {
          const c = paletaF && paletaF.length >= 3 ? [paletaF[0], paletaF[1], paletaF[2]] : [0, 0, 0];
          base = llenar(W * H, 4, [c[0], c[1], c[2], 255]);
          for (let yy = 0; yy < pH; yy++) base.set(previo.subarray(yy * pW * 4, (yy + 1) * pW * 4), yy * W * 4);
        }
      }
      let marco;
      if (D.transpF !== null) marco = paletaF ? p2rgba(tmp, paletaF, D.transpF, true) : l2rgba(tmp, D.transpF);
      else marco = paletaF ? p2rgba(tmp, paletaF, -1, false) : l2rgba(tmp, null);
      for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) {
        if (xx >= W || yy >= H) continue;
        const o = (yy * W + xx) * 4;
        if (D.transpF !== null) {
          const a = marco[o + 3], na = 255 - a;
          for (let c = 0; c < 4; c++) base[o + c] = div255(base[o + c] * na + marco[o + c] * a);
        } else {
          for (let c = 0; c < 4; c++) base[o + c] = marco[o + c];
        }
      }
      im = base;
    }
    let rgba;
    if (modo === "P") rgba = p2rgba(im, paletaImg, info.transparency, "transparency" in info);
    else if (modo === "L") rgba = l2rgba(im, info.transparency);
    else {
      rgba = new Uint8Array(im);
      if (modo === "RGB") for (let i = 3; i < rgba.length; i += 4) rgba[i] = 255;
    }
    salida.push({ w: W, h: H, d: rgba });
  }
  return { frames: salida, animado };
}

function llenar(n, canales, valor) {
  const out = new Uint8Array(n * canales);
  for (let i = 0; i < n; i++) for (let c = 0; c < canales; c++) out[i * canales + c] = valor[c];
  return out;
}

export const LEEME_ARCHIVOS = ["LEEME.txt", "README.txt", "LEIA-ME.txt", "ПРОЧТИ.txt", "LIESMICH.txt"];

export const LEEME = {
  en: {
    archivo: "README.txt",
    titulo: "{nombre} - 2D Nextbot",
    generado: "Generated with {prog} {ver} on {fecha}",
    requiere: "REQUIRES: DrGBase | Nextbot Base (Steam Workshop id {id})",
    clase: "Class:      {clase}",
    menu: "Q menu:     NPCs > {cat} > {nombre}",
    sprites: "Sprites:    materials/sprites2d/{slug}/",
    sonidos: "Sounds:     sound/{slug}/  ({lista})",
    ninguno: "none",
    altura: "Height:     {alt} units (player = 72)",
    frames: "Frames:     {frames} @ {fps} fps",
    workshop: "To publish on the Workshop, use gmpublisher or the Steam tools by hand:\n  gmad.exe create -folder <this folder> -out x.gma\n  gmpublish.exe create -addon x.gma -icon icon.jpg (512x512)",
  },
  es: {
    archivo: "LEEME.txt",
    titulo: "{nombre} - Nextbot 2D",
    generado: "Generado con {prog} {ver} el {fecha}",
    requiere: "REQUIERE: DrGBase | Nextbot Base (Steam Workshop id {id})",
    clase: "Clase:      {clase}",
    menu: "Menú Q:     NPCs > {cat} > {nombre}",
    sprites: "Sprites:    materials/sprites2d/{slug}/",
    sonidos: "Sonidos:    sound/{slug}/  ({lista})",
    ninguno: "ninguno",
    altura: "Altura:     {alt} unidades (jugador = 72)",
    frames: "Frames:     {frames} @ {fps} fps",
    workshop: "Para publicar en el Workshop, usá gmpublisher o las herramientas de Steam a mano:\n  gmad.exe create -folder <esta carpeta> -out x.gma\n  gmpublish.exe create -addon x.gma -icon icono.jpg (512x512)",
  },
};

function formato(t, vals) { return t.replace(/\{(\w+)\}/g, (m, k) => (k in vals ? String(vals[k]) : m)); }

function fechaTexto(f) {
  const d2 = (n) => String(n).padStart(2, "0");
  return `${f.getFullYear()}-${d2(f.getMonth() + 1)}-${d2(f.getDate())} ${d2(f.getHours())}:${d2(f.getMinutes())}`;
}

function crlf(s) { return s.replace(/\n/g, "\r\n"); }

function luaStr(s) { return '"' + String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"'; }

export function generarLua(cfg, plantilla, sonidos, info, fecha) {
  const dv = derivados(cfg);
  let lua = plantilla.replace(/\r\n?/g, "\n");
  const snd = (k) => (sonidos[k] ? luaStr(sonidos[k]) : "nil");
  const alto = Number(cfg.altura);
  const ancho = alto * info.aspecto;
  const hx = Math.trunc(Math.max(10, Math.min(40, ancho / 4)));
  const b = (v) => (v ? "true" : "false");
  const val = [
    ["SELLO", `-- Generado por ${NOMBRE_PROGRAMA} ${VERSION} | ${fechaTexto(fecha)}`],
    ["PER", luaStr(dv.modelo)],
    ["CLASE_STR", luaStr(dv.clase)],
    ["PRINTNAME", luaStr(cfg.nombre)],
    ["CATEGORIA", luaStr(cfg.categoria || "2D Nextbots")],
    ["AUTOR", luaStr(cfg.autor)],
    ["FPS", String(info.fps)],
    ["ALTURA", pyG(alto)],
    ["ESCALA_SPRITE", pyFixed(info.escala_sprite, 4)],
    ["ILUMINADO", b(cfg.iluminado)],
    ["TIENE_RUN", b(info.tiene_run)],
    ["TIENE_ATTACK", b(info.tiene_attack)],
    ["JUMPSCARE", b(cfg.jumpscare)],
    ["JUMPSCARE_DUR", pyG(Number(cfg.duracion_jumpscare))],
    ["HITBOX_X", String(hx)],
    ["HITBOX_Z", String(Math.trunc(alto))],
    ["OJOS_Z", String(Math.trunc(alto * 0.8))],
    ["SANGRE", cfg.sangre || "DONT_BLEED"],
    ["SALUD", String(Math.trunc(cfg.salud))],
    ["OMNISCIENTE", b(cfg.omnisciente)],
    ["RANGO", String(Math.trunc(cfg.rango_ataque))],
    ["FACCION", luaStr(cfg.faccion || "FACTION_2DNEXTBOTS")],
    ["WALK", String(Math.trunc(cfg.velocidad_caminar))],
    ["RUN", String(Math.trunc(cfg.velocidad))],
    ["ACEL", String(Math.trunc(cfg.aceleracion))],
    ["SALTO", String(Math.trunc(cfg.salto))],
    ["ESCALAR", b(cfg.escalar)],
    ["SALTAR", b(cfg.saltar)],
    ["SALTO_MAX", String(Math.trunc(cfg.salto_max))],
    ["PUERTAS", luaStr(["romper", "abrir", "no"].includes(cfg.puertas) ? cfg.puertas : "romper")],
    ["ROMPER_PROPS", b(cfg.romper_props)],
    ["POSESION", b(cfg.posesion)],
    ["DMG_MIN", String(Math.trunc(Math.min(cfg.danio_min, cfg.danio_max)))],
    ["DMG_MAX", String(Math.trunc(Math.max(cfg.danio_min, cfg.danio_max)))],
    ["ATAQUE_INTERVALO", pyG(Number(cfg.ataque_intervalo))],
    ["ATAQUE_RETARDO", pyG(Number(cfg.ataque_retardo))],
    ["VOLUMEN", pyG(Number(cfg.volumen))],
    ["SND_PANIC", snd("panic")], ["SND_SPAWN", snd("spawn")], ["SND_KILL", snd("kill")],
    ["SND_STEP", snd("step")], ["SND_DEATH", snd("death")], ["SND_IDLE", snd("idle")],
    ["SND_ATTACK", snd("attack")],
  ];
  for (const [k, v] of val) lua = lua.split("{{" + k + "}}").join(v);
  return crlf(lua);
}

export function tituloWorkshop(cfg) {
  const t = pyStrip(String(cfg.titulo_workshop || ""));
  return t || `${cfg.nombre} - 2D Nextbot`;
}

export function generarAddonJson(cfg) {
  const datos = {
    title: tituloWorkshop(cfg),
    type: "entity",
    tags: ["fun", "scenic"],
    ignore: ["*.psd", "*.vcproj", "*.svn*", "*.txt", "*.md", "*.log", "*.jpg", "*.json.bak", "nb2d_workshop.json", "*.gma"],
  };
  return crlf(JSON.stringify(datos, null, 2));
}

export function generarLeeme(cfg, sonidos, info, idioma, fecha) {
  const t = LEEME[idioma] || LEEME.en;
  const dv = derivados(cfg);
  const fr = Object.entries(info.frames || {}).map(([k, v]) => `${k}: ${v}`).join(", ") || "-";
  const lista = CLAVES_AUDIO.filter((k) => k in sonidos).join(", ") || t.ninguno;
  const lineas = [
    formato(t.titulo, { nombre: cfg.nombre }),
    formato(t.generado, { prog: NOMBRE_PROGRAMA, ver: VERSION, fecha: fechaTexto(fecha) }),
    "",
    formato(t.requiere, { id: DRGBASE_ID }),
    `https://steamcommunity.com/sharedfiles/filedetails/?id=${DRGBASE_ID}`,
    "",
    formato(t.clase, { clase: dv.clase }),
    formato(t.menu, { cat: cfg.categoria, nombre: cfg.nombre }),
    formato(t.sprites, { slug: dv.modelo }),
    formato(t.sonidos, { slug: dv.modelo, lista }),
    formato(t.altura, { alt: pyG(Number(cfg.altura)) }),
    formato(t.frames, { frames: fr, fps: info.fps }),
    "",
    t.workshop,
  ];
  return crlf(lineas.join("\n") + "\n");
}

export function validar(cfg, frames) {
  const errores = [];
  if (!frames || !frames.length) errores.push("imagen");
  if (!pyStrip(String(cfg.nombre))) errores.push("nombre");
  const a = Number(cfg.altura);
  if (!Number.isFinite(a)) errores.push("altura_num");
  else if (!(a >= 8 && a <= 4096)) errores.push("altura_rango");
  return errores;
}

export async function construir(cfg, entrada) {
  const dv = derivados(cfg);
  const fecha = entrada.fecha || new Date();
  const archivos = [];
  const texto = new TextEncoder();
  let idle = entrada.frames.map(copiaImg);
  let icono = copiaImg(entrada.frames[0]);
  let recortados = 0;
  if (entrada.quitarFondo) {
    idle = idle.map((f) => { const r = quitarFondoLiso(f); if (r.tocada) recortados++; return r.img; });
    icono = quitarFondoLiso(icono).img;
  }
  const todos = { idle };
  const plano = [].concat(...Object.values(todos));
  const enc = encuadrarPow2(plano);
  const info = {
    escala_sprite: enc.lado / enc.alto, aspecto: enc.ancho / enc.alto,
    tiene_run: "run" in todos, tiene_attack: "attack" in todos, lado: enc.lado, frames: {},
  };
  let i = 0;
  for (const [anim, lista] of Object.entries(todos)) {
    for (let n = 0; n < lista.length; n++) {
      archivos.push({ ruta: `materials/sprites2d/${dv.modelo}/${anim}${n + 1}.png`, datos: await codificarPng(enc.listos[i]) });
      i++;
    }
    info.frames[anim] = lista.length;
  }
  let fps = cfg.fps ? Math.trunc(cfg.fps) : 0;
  if (!fps) fps = entrada.fpsGif || 8;
  info.fps = Math.max(1, Math.min(30, fps));
  const sonidos = {};
  for (const clave of CLAVES_AUDIO) {
    const s = entrada.sonidos && entrada.sonidos[clave];
    if (!s) continue;
    const ext = s.ext.toLowerCase();
    if (!AUDIO_NATIVO.includes(ext)) continue;
    archivos.push({ ruta: `sound/${dv.modelo}/${clave}${ext}`, datos: s.datos });
    sonidos[clave] = `${dv.modelo}/${clave}${ext}`;
  }
  archivos.push({ ruta: `lua/entities/${dv.clase}.lua`, datos: texto.encode(generarLua(cfg, entrada.plantilla, sonidos, info, fecha)) });
  archivos.push({ ruta: `materials/entities/${dv.clase}.png`, datos: await codificarPng(generarIcono(icono)) });
  archivos.push({ ruta: "addon.json", datos: texto.encode(generarAddonJson(cfg)) });
  const t = LEEME[entrada.idioma] || LEEME.en;
  archivos.push({ ruta: t.archivo, datos: texto.encode(generarLeeme(cfg, sonidos, info, entrada.idioma, fecha)) });
  return { archivos, info, derivados: dv, recortados, sonidos };
}

function fechaDos(f) {
  const t = ((f.getHours() << 11) | (f.getMinutes() << 5) | Math.floor(f.getSeconds() / 2)) & 0xffff;
  const d = (((f.getFullYear() - 1980) << 9) | ((f.getMonth() + 1) << 5) | f.getDate()) & 0xffff;
  return [t, d];
}

export async function crearZip(entradas, fecha = new Date()) {
  const texto = new TextEncoder();
  const [t, d] = fechaDos(fecha);
  const locales = [], centrales = [];
  let offset = 0;
  for (const e of entradas) {
    const nombre = texto.encode(e.ruta);
    const crc = crc32(e.datos);
    const binario = /\.(png|mp3|ogg)$/i.test(e.ruta);
    const comp = binario ? e.datos : await comprimirCrudo(e.datos);
    const metodo = binario ? 0 : 8;
    const utf = /[^\x00-\x7f]/.test(e.ruta) ? 0x0800 : 0;
    const lh = new Uint8Array(30 + nombre.length);
    const lv = new DataView(lh.buffer);
    lv.setUint32(0, 0x04034b50, true); lv.setUint16(4, 20, true); lv.setUint16(6, utf, true);
    lv.setUint16(8, metodo, true); lv.setUint16(10, t, true); lv.setUint16(12, d, true);
    lv.setUint32(14, crc, true); lv.setUint32(18, comp.length, true); lv.setUint32(22, e.datos.length, true);
    lv.setUint16(26, nombre.length, true); lv.setUint16(28, 0, true);
    lh.set(nombre, 30);
    locales.push(lh, comp);
    const ch = new Uint8Array(46 + nombre.length);
    const cv = new DataView(ch.buffer);
    cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true);
    cv.setUint16(8, utf, true); cv.setUint16(10, metodo, true); cv.setUint16(12, t, true); cv.setUint16(14, d, true);
    cv.setUint32(16, crc, true); cv.setUint32(20, comp.length, true); cv.setUint32(24, e.datos.length, true);
    cv.setUint16(28, nombre.length, true); cv.setUint32(42, offset, true);
    ch.set(nombre, 46);
    centrales.push(ch);
    offset += lh.length + comp.length;
  }
  const central = unir(centrales);
  const fin = new Uint8Array(22);
  const fv = new DataView(fin.buffer);
  fv.setUint32(0, 0x06054b50, true);
  fv.setUint16(8, entradas.length, true); fv.setUint16(10, entradas.length, true);
  fv.setUint32(12, central.length, true); fv.setUint32(16, offset, true);
  return unir([...locales, central, fin]);
}
