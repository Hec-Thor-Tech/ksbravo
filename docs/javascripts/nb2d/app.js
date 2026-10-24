const raiz = document.getElementById("ks-nb2d");

const TEXTOS = {
  en: {
    elegir: "Choose an image",
    jugador: "Player (72 units)",
    cuadros: "{n} frames",
    leyendo: "Reading the image...",
    malaImagen: "This image could not be read. Try a PNG, JPG, WEBP or GIF.",
    malSonido: "Only MP3, WAV or OGG files.",
    faltaImagen: "Choose an image first.",
    faltaNombre: "Write a name.",
    alturaNum: "The height must be a number.",
    alturaRango: "The height must be between 8 and 4096.",
    armando: "Making the addon...",
    noAddons: "The folder you chose is \"{nombre}\", not \"addons\". Save the addon inside it anyway?",
    reemplazar: "The folder \"{carpeta}\" already exists in addons. Replace its files?",
    cancelado: "Cancelled. Nothing was saved.",
    canceladoCarpeta: "Cancelled. Nothing was saved. If the browser did not let you pick the folder, use Download ZIP.",
    sinPermiso: "The browser did not get permission to write in that folder.",
    listoCarpeta: "Done. Saved to addons/{carpeta}. Restart Garry's Mod or change the map, then open the Q menu: NPCs > {cat} > {nombre}.",
    listoZip: "Done. Unzip \"{zip}\" inside garrysmod/addons. Then restart Garry's Mod or change the map and open the Q menu: NPCs > {cat} > {nombre}.",
    fondo: "Plain background removed from {n} frame(s).",
    error: "Something went wrong: {msg}",
  },
  es: {
    elegir: "Elegí una imagen",
    jugador: "Jugador (72 unidades)",
    cuadros: "{n} cuadros",
    leyendo: "Leyendo la imagen...",
    malaImagen: "No se pudo leer esta imagen. Probá con un PNG, JPG, WEBP o GIF.",
    malSonido: "Solo archivos MP3, WAV u OGG.",
    faltaImagen: "Primero elegí una imagen.",
    faltaNombre: "Escribí un nombre.",
    alturaNum: "La altura tiene que ser un número.",
    alturaRango: "La altura tiene que estar entre 8 y 4096.",
    armando: "Armando el addon...",
    noAddons: "La carpeta que elegiste es \"{nombre}\", no \"addons\". ¿Guardar el addon adentro igual?",
    reemplazar: "La carpeta \"{carpeta}\" ya existe en addons. ¿Reemplazar sus archivos?",
    cancelado: "Cancelado. No se guardó nada.",
    canceladoCarpeta: "Cancelado. No se guardó nada. Si el navegador no te dejó elegir la carpeta, usá Descargar ZIP.",
    sinPermiso: "El navegador no tuvo permiso para escribir en esa carpeta.",
    listoCarpeta: "Listo. Se guardó en addons/{carpeta}. Reiniciá Garry's Mod o cambiá de mapa, y abrí el menú Q: NPCs > {cat} > {nombre}.",
    listoZip: "Listo. Descomprimí \"{zip}\" dentro de garrysmod/addons. Después reiniciá Garry's Mod o cambiá de mapa y abrí el menú Q: NPCs > {cat} > {nombre}.",
    fondo: "Se quitó el fondo liso en {n} cuadro(s).",
    error: "Algo salió mal: {msg}",
  },
};

if (raiz) iniciar();

async function iniciar() {
  const q = new URL(import.meta.url).search;
  const N = await import("./nb2d.js" + q);
  const idioma = (document.documentElement.lang || "en").toLowerCase().startsWith("es") ? "es" : "en";
  const T = TEXTOS[idioma];
  const f = (t, v) => t.replace(/\{(\w+)\}/g, (m, k) => (k in v ? v[k] : m));
  const $ = (id) => document.getElementById(id);
  const estado = $("nb2d-estado");
  const avisar = (txt, tipo = "") => { estado.textContent = txt; estado.className = "ks-nb2d-estado " + tipo; };

  let plantilla = null;
  const traerPlantilla = async () => {
    if (!plantilla) {
      const r = await fetch(new URL("plantilla_2d.lua" + q, import.meta.url));
      if (!r.ok) throw new Error("plantilla_2d.lua");
      plantilla = await r.text();
    }
    return plantilla;
  };

  const estadoImg = { frames: null, nombre: "", vista: null, vistaFondo: null };
  const sonidos = {};

  const lienzo = $("nb2d-vista");
  const ctx = lienzo.getContext("2d");
  let cuadro = 0, temporizador = null;

  const aCanvas = (im) => {
    const c = document.createElement("canvas");
    c.width = im.w; c.height = im.h;
    c.getContext("2d").putImageData(new ImageData(new Uint8ClampedArray(im.d), im.w, im.h), 0, 0);
    return c;
  };

  const prepararVista = () => {
    if (!estadoImg.frames) return;
    const usar = $("nb2d-fondo").checked
      ? estadoImg.frames.map((fr) => N.quitarFondoLiso(N.copiaImg(fr)).img)
      : estadoImg.frames;
    const recortados = N.recortarGrupo(usar);
    estadoImg.vista = recortados.map(aCanvas);
    estadoImg.tam = [recortados[0].w, recortados[0].h];
    cuadro = 0;
    clearInterval(temporizador);
    if (estadoImg.vista.length > 1) {
      temporizador = setInterval(() => { cuadro = (cuadro + 1) % estadoImg.vista.length; dibujar(); }, 125);
    }
    dibujar();
  };

  const dibujar = () => {
    const ancho = lienzo.clientWidth || 520;
    const escalaPx = window.devicePixelRatio || 1;
    const W = Math.round(ancho), H = Math.round(ancho * 0.62);
    if (lienzo.width !== Math.round(W * escalaPx)) { lienzo.width = Math.round(W * escalaPx); lienzo.height = Math.round(H * escalaPx); }
    ctx.setTransform(escalaPx, 0, 0, escalaPx, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.font = "13px Roboto, sans-serif";
    ctx.textAlign = "center";
    if (!estadoImg.vista) {
      ctx.fillStyle = "rgba(255,255,255,.55)";
      ctx.fillText(T.elegir, W / 2, H / 2);
      return;
    }
    const img = estadoImg.vista[cuadro];
    let altura = parseFloat($("nb2d-altura").value);
    if (!Number.isFinite(altura) || altura <= 0) altura = 96;
    const aspecto = img.width / img.height;
    const maxU = Math.max(altura, 72) * 1.18;
    const pxAlto = (H - 44) / maxU;
    const pxAncho = (W - 40 - 24) / (32 + altura * aspecto);
    const pxU = Math.min(pxAlto, pxAncho);
    const altoPx = Math.max(1, Math.trunc(altura * pxU));
    const anchoPx = Math.max(1, Math.trunc(altoPx * aspecto));
    const piso = H - 20;
    ctx.strokeStyle = "rgba(255,255,255,.18)";
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(0, piso + 0.5); ctx.lineTo(W, piso + 0.5); ctx.stroke();
    const jh = Math.trunc(72 * pxU), jw = Math.trunc(32 * pxU), jx = 20;
    ctx.strokeStyle = "#5aa9ff";
    ctx.setLineDash([3, 2]);
    ctx.strokeRect(jx + 0.5, piso - jh + 0.5, jw, jh);
    ctx.setLineDash([]);
    ctx.fillStyle = "#5aa9ff";
    ctx.font = "11px Roboto, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(T.jugador, jx, piso - jh - 8);
    ctx.textAlign = "center";
    const sx = jx + jw + 24 + Math.floor(anchoPx / 2);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, sx - anchoPx / 2, piso - altoPx, anchoPx, altoPx);
    ctx.fillStyle = "#ff5a1f";
    ctx.font = "bold 12px Roboto, sans-serif";
    ctx.fillText(N.pyG(altura) + "u", sx, piso - altoPx - 8);
  };

  const quitarExif = (b) => {
    if (b[0] !== 0xff || b[1] !== 0xd8) return b;
    const partes = [b.subarray(0, 2)];
    let p = 2;
    while (p + 4 <= b.length && b[p] === 0xff) {
      const m = b[p + 1];
      if (m === 0xda) break;
      const len = (b[p + 2] << 8) | b[p + 3];
      if (m !== 0xe1 && m !== 0xe2) partes.push(b.subarray(p, p + 2 + len));
      p += 2 + len;
    }
    partes.push(b.subarray(p));
    const total = partes.reduce((s, x) => s + x.length, 0);
    const out = new Uint8Array(total);
    let o = 0;
    for (const x of partes) { out.set(x, o); o += x.length; }
    return out;
  };

  const pixelesGL = (fuente, w, h) => {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const gl = c.getContext("webgl", { premultipliedAlpha: false });
    if (!gl || w > gl.getParameter(gl.MAX_TEXTURE_SIZE) || h > gl.getParameter(gl.MAX_TEXTURE_SIZE)) return null;
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, fuente);
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) return null;
    const d = new Uint8Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, d);
    gl.deleteFramebuffer(fb);
    gl.deleteTexture(tex);
    const ext = gl.getExtension("WEBGL_lose_context");
    if (ext) ext.loseContext();
    return { w, h, d };
  };

  const pixeles2D = (fuente, w, h) => {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const g = c.getContext("2d");
    g.drawImage(fuente, 0, 0);
    return { w, h, d: new Uint8Array(g.getImageData(0, 0, w, h).data.buffer) };
  };

  const decodificarNavegador = async (bytes, tipo) => {
    if (tipo === "image/webp" && "ImageDecoder" in window) {
      try {
        const dec = new ImageDecoder({ data: bytes, type: tipo, premultiplyAlpha: "none", colorSpaceConversion: "none" });
        await dec.tracks.ready;
        const n = dec.tracks.selectedTrack ? dec.tracks.selectedTrack.frameCount : 1;
        if (n > 1) {
          const frames = [];
          for (let i = 0; i < Math.min(n, N.MAX_FRAMES); i++) {
            const { image } = await dec.decode({ frameIndex: i });
            const w = image.displayWidth, h = image.displayHeight;
            const px = pixelesGL(image, w, h) || pixeles2D(image, w, h);
            image.close();
            frames.push(px);
          }
          dec.close();
          return { frames, animado: true };
        }
        dec.close();
      } catch (e) { }
    }
    const blob = new Blob([tipo === "image/jpeg" ? quitarExif(bytes) : bytes], { type: tipo });
    let bmp;
    try {
      bmp = await createImageBitmap(blob, { premultiplyAlpha: "none", colorSpaceConversion: "none", imageOrientation: "none" });
    } catch (e) {
      bmp = await createImageBitmap(blob, { premultiplyAlpha: "none", colorSpaceConversion: "none" });
    }
    const px = pixelesGL(bmp, bmp.width, bmp.height) || pixeles2D(bmp, bmp.width, bmp.height);
    bmp.close();
    return { frames: [px], animado: false };
  };

  const decodificar = async (bytes) => {
    const c = (i) => bytes[i];
    if (c(0) === 0x89 && c(1) === 0x50 && c(2) === 0x4e && c(3) === 0x47) return N.decodificarPng(bytes);
    if (c(0) === 0x47 && c(1) === 0x49 && c(2) === 0x46) return N.decodificarGif(bytes);
    if (c(0) === 0xff && c(1) === 0xd8) return decodificarNavegador(bytes, "image/jpeg");
    if (c(0) === 0x52 && c(1) === 0x49 && c(2) === 0x46 && c(3) === 0x46 && c(8) === 0x57 && c(9) === 0x45 && c(10) === 0x42 && c(11) === 0x50) {
      return decodificarNavegador(bytes, "image/webp");
    }
    throw new Error("formato");
  };

  $("nb2d-imagen").addEventListener("change", async (ev) => {
    const archivo = ev.target.files && ev.target.files[0];
    if (!archivo) return;
    avisar(T.leyendo);
    try {
      const bytes = new Uint8Array(await archivo.arrayBuffer());
      const r = await decodificar(bytes);
      if (!r.frames.length) throw new Error("vacia");
      estadoImg.frames = r.frames;
      estadoImg.nombre = archivo.name;
      prepararVista();
      const [w, h] = estadoImg.tam;
      let info = `${archivo.name}  ${w}x${h}`;
      if (r.frames.length > 1) info += "  ·  " + f(T.cuadros, { n: r.frames.length });
      $("nb2d-info").textContent = info;
      $("nb2d-nombre-img").textContent = archivo.name;
      avisar("");
    } catch (e) {
      estadoImg.frames = null;
      estadoImg.vista = null;
      clearInterval(temporizador);
      dibujar();
      $("nb2d-info").textContent = "";
      avisar(T.malaImagen, "mal");
    }
  });

  $("nb2d-fondo").addEventListener("change", prepararVista);

  const rango = $("nb2d-altura-rango"), numero = $("nb2d-altura");
  rango.addEventListener("input", () => { numero.value = rango.value; dibujar(); });
  numero.addEventListener("input", () => {
    const v = parseFloat(numero.value);
    if (Number.isFinite(v)) rango.value = Math.min(400, Math.max(16, v));
    dibujar();
  });
  window.addEventListener("resize", dibujar);

  for (const clave of N.CLAVES_AUDIO) {
    const entrada = $("nb2d-snd-" + clave);
    if (!entrada) continue;
    const nombre = $("nb2d-snd-" + clave + "-nombre");
    const boton = $("nb2d-snd-" + clave + "-quitar");
    entrada.addEventListener("change", async () => {
      const a = entrada.files && entrada.files[0];
      if (!a) return;
      const ext = (a.name.match(/\.[^.]+$/) || [""])[0].toLowerCase();
      if (!N.AUDIO_NATIVO.includes(ext)) {
        entrada.value = "";
        avisar(T.malSonido, "mal");
        return;
      }
      sonidos[clave] = { ext, datos: new Uint8Array(await a.arrayBuffer()) };
      nombre.textContent = a.name;
      boton.hidden = false;
      avisar("");
    });
    boton.addEventListener("click", () => {
      delete sonidos[clave];
      entrada.value = "";
      nombre.textContent = "";
      boton.hidden = true;
    });
  }

  const CLAVE_FIRMA = "ks-nb2d-firma";
  const campoFirma = $("nb2d-firma");
  let firmaGuardada = null;
  try { firmaGuardada = localStorage.getItem(CLAVE_FIRMA); } catch (e) { }
  if (firmaGuardada === null) {
    const letras = "abcdefghijkmnpqrstuvwxyz", todos = letras + "23456789";
    const r = crypto.getRandomValues(new Uint8Array(4));
    firmaGuardada = letras[r[0] % letras.length] + [1, 2, 3].map((i) => todos[r[i] % todos.length]).join("");
    try { localStorage.setItem(CLAVE_FIRMA, firmaGuardada); } catch (e) { }
  }
  campoFirma.value = firmaGuardada;
  campoFirma.addEventListener("change", () => { try { localStorage.setItem(CLAVE_FIRMA, campoFirma.value); } catch (e) { } });

  const valores = () => ({
    nombre: $("nb2d-nombre").value,
    firma: campoFirma.value,
    altura: $("nb2d-altura").value,
    categoria: $("nb2d-categoria").value,
    salud: $("nb2d-salud").value,
    velocidad: $("nb2d-velocidad").value,
    danio_min: $("nb2d-danio-min").value,
    danio_max: $("nb2d-danio-max").value,
  });

  const armar = async () => {
    const cfg = N.aplicarValores(N.configBase(), valores());
    const errores = N.validar(cfg, estadoImg.frames);
    if (errores.length) {
      const e = errores[0];
      avisar(e === "imagen" ? T.faltaImagen : e === "nombre" ? T.faltaNombre : e === "altura_num" ? T.alturaNum : T.alturaRango, "mal");
      return null;
    }
    avisar(T.armando);
    await new Promise((r) => setTimeout(r, 30));
    const res = await N.construir(cfg, {
      frames: estadoImg.frames, sonidos, plantilla: await traerPlantilla(), idioma,
      quitarFondo: $("nb2d-fondo").checked,
    });
    return { cfg, res };
  };

  const final = (txt, r) => {
    let extra = "";
    if (r.res.recortados) extra = " " + f(T.fondo, { n: r.res.recortados });
    avisar(txt + extra, "bien");
  };

  const existe = async (dir, nombre, tipo = "dir") => {
    try {
      if (tipo === "dir") return await dir.getDirectoryHandle(nombre);
      return await dir.getFileHandle(nombre);
    } catch (e) {
      return null;
    }
  };

  const borrarSi = async (dir, filtro) => {
    if (!dir) return;
    const nombres = [];
    for await (const [n, h] of dir.entries()) if (h.kind === "file" && filtro(n.toLowerCase())) nombres.push(n);
    for (const n of nombres) { try { await dir.removeEntry(n); } catch (e) { } }
  };

  const bajarDir = async (dir, partes, crear) => {
    for (const p of partes) {
      dir = crear ? await dir.getDirectoryHandle(p, { create: true }) : await existe(dir, p);
      if (!dir) return null;
    }
    return dir;
  };

  const btnCarpeta = $("nb2d-guardar-carpeta");
  if (!("showDirectoryPicker" in window)) {
    btnCarpeta.hidden = true;
    const ayuda = $("nb2d-ayuda-carpeta");
    if (ayuda) ayuda.hidden = true;
  }

  btnCarpeta.addEventListener("click", async () => {
    let elegida;
    try {
      elegida = await window.showDirectoryPicker({ id: "nb2d-addons", mode: "readwrite" });
    } catch (e) {
      avisar(T.canceladoCarpeta);
      return;
    }
    try {
      let addons = elegida;
      if (elegida.name.toLowerCase() !== "addons") {
        const gm = await existe(elegida, "garrysmod");
        const dentro = gm ? await existe(gm, "addons") : await existe(elegida, "addons");
        if (dentro) addons = dentro;
        else if (!window.confirm(f(T.noAddons, { nombre: elegida.name }))) { avisar(T.cancelado); return; }
      }
      if (addons.requestPermission && (await addons.requestPermission({ mode: "readwrite" })) !== "granted") {
        avisar(T.sinPermiso, "mal");
        return;
      }
      const r = await armar();
      if (!r) return;
      const { res, cfg } = r;
      const dv = res.derivados;
      const previa = await existe(addons, dv.paquete);
      if (previa && !window.confirm(f(T.reemplazar, { carpeta: dv.paquete }))) { avisar(T.cancelado); return; }
      const carpeta = await addons.getDirectoryHandle(dv.paquete, { create: true });
      await borrarSi(await bajarDir(carpeta, ["materials", "sprites2d", dv.modelo], false), (n) => n.endsWith(".png"));
      await borrarSi(await bajarDir(carpeta, ["sound", dv.modelo], false), (n) => N.AUDIO_NATIVO.some((e) => n.endsWith(e)));
      const leemes = new Set(N.LEEME_ARCHIVOS.map((n) => n.toLowerCase()));
      await borrarSi(carpeta, (n) => leemes.has(n));
      for (const a of res.archivos) {
        const partes = a.ruta.split("/");
        const nombre = partes.pop();
        const dir = await bajarDir(carpeta, partes, true);
        const fh = await dir.getFileHandle(nombre, { create: true });
        const w = await fh.createWritable();
        await w.write(a.datos);
        await w.close();
      }
      final(f(T.listoCarpeta, { carpeta: dv.paquete, cat: cfg.categoria, nombre: cfg.nombre }), r);
    } catch (e) {
      avisar(e && e.name === "NotAllowedError" ? T.sinPermiso : f(T.error, { msg: (e && e.message) || e }), "mal");
    }
  });

  $("nb2d-guardar-zip").addEventListener("click", async () => {
    try {
      const r = await armar();
      if (!r) return;
      const { res, cfg } = r;
      const dv = res.derivados;
      const zip = await N.crearZip(res.archivos.map((a) => ({ ruta: dv.paquete + "/" + a.ruta, datos: a.datos })));
      const nombreZip = `${dv.paquete} V_${cfg.version_zip}.zip`;
      const url = URL.createObjectURL(new Blob([zip], { type: "application/zip" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = nombreZip;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      final(f(T.listoZip, { zip: nombreZip, cat: cfg.categoria, nombre: cfg.nombre }), r);
    } catch (e) {
      avisar(f(T.error, { msg: (e && e.message) || e }), "mal");
    }
  });

  raiz.classList.add("listo");
  dibujar();
}
