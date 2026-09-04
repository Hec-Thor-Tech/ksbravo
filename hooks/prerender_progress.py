# -*- coding: utf-8 -*-
"""
Hook de MkDocs: dibuja las barras de progreso EN EL HTML, al compilar.

El problema: docs/javascripts/progress.js llenaba <div id="ks-progress">
recien cuando el navegador terminaba de bajar y correr el JS. En un celular
lento eso pasa despues del primer pintado, asi que el bloque aparecia de
golpe y empujaba todo lo de abajo. Eso es el CLS malo que marcaba Cloudflare.

Aca leemos el MISMO progress-data.js que escribe el Gestor Web y generamos el
mismo HTML que generaba el JS, pero durante el build. El navegador lo recibe
ya dibujado: cero salto. De paso Google ve el contenido, que antes era una
pagina vacia para el buscador.

progress.js NO se toca y sigue en su lugar: si algo aca falla, el <div> queda
vacio como antes y el JS lo llena igual que siempre. Nunca se rompe la pagina.
Por eso el contenedor sale con data-done="1", que es la bandera que el propio
progress.js mira para no dibujar dos veces.
"""

import os
import re
import json
import math
from html import escape

MARCA = '<div id="ks-progress"></div>'

TEXTOS = {
    "en": {"steps": "steps", "updated": "Last updated",
           "done": "Done", "progress": "In progress", "pending": "Queued",
           "video": "Watch the test on YouTube", "video_corto": "Test"},
    "es": {"steps": "pasos", "updated": "Actualizado",
           "done": "Terminado", "progress": "En progreso", "pending": "En cola",
           "video": "Ver test en YouTube", "video_corto": "Test"},
}

PLAY = ('<svg viewBox="0 0 24 24" aria-hidden="true">'
        '<path d="M8 5v14l11-7z"/></svg>')

# Corazon del boton de reacciones.
CORAZON = ('<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.35l-1.45-1.32'
           'C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09'
           'C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 '
           '11.54L12 21.35z"/></svg>')

TEXTOS["en"]["reaccion"] = "I like this one"
TEXTOS["es"]["reaccion"] = "Me gusta este"


def _slug(nombre):
    """Mismo criterio que usa el Gestor Web para nombrar las imagenes."""
    s = (nombre or "").lower().strip()
    for a, b in (("á", "a"), ("é", "e"), ("í", "i"), ("ó", "o"),
                 ("ú", "u"), ("ñ", "n"), ("ü", "u")):
        s = s.replace(a, b)
    return re.sub(r"[^a-z0-9]+", "", s) or "sinnombre"


def _sin_comentarios(txt):
    """Saca el encabezado /* */ y las lineas que son solo //.

    Ojo: se descartan solo las lineas que ARRANCAN con //, nunca un // que
    aparezca dentro de un texto (por ejemplo una URL en una nota).
    """
    txt = re.sub(r"/\*.*?\*/", "", txt, flags=re.S)
    lineas = [l for l in txt.split("\n") if not l.strip().startswith("//")]
    return "\n".join(lineas)


def _a_json(txt):
    """Convierte el objeto JS a JSON poniendole comillas a las claves.

    Recorre caracter por caracter llevando la cuenta de si esta adentro de un
    texto entre comillas, asi una nota que diga 'name: algo' no se toca.
    """
    salida = []
    i = 0
    en_texto = False
    claves = ("updated", "packs", "name", "note_es", "note", "total",
              "models", "steps", "img", "imgv", "video")
    while i < len(txt):
        c = txt[i]
        if en_texto:
            salida.append(c)
            if c == "\\" and i + 1 < len(txt):
                salida.append(txt[i + 1])
                i += 2
                continue
            if c == '"':
                en_texto = False
            i += 1
            continue
        if c == '"':
            en_texto = True
            salida.append(c)
            i += 1
            continue
        for k in claves:
            if txt.startswith(k, i) and re.match(r"\s*:", txt[i + len(k):]):
                anterior = txt[i - 1] if i else ""
                if anterior in "{,\n\r\t ":
                    salida.append('"' + k + '"')
                    i += len(k)
                    break
        else:
            salida.append(c)
            i += 1
    return "".join(salida)


def _leer_datos(docs_dir):
    ruta = os.path.join(docs_dir, "javascripts", "progress-data.js")
    if not os.path.isfile(ruta):
        return None
    with open(ruta, encoding="utf-8") as f:
        crudo = f.read()
    cuerpo = _sin_comentarios(crudo)
    m = re.search(r"window\.KS_PROGRESS\s*=\s*(\{.*\})\s*;", cuerpo, flags=re.S)
    if not m:
        return None
    texto = _a_json(m.group(1))
    texto = re.sub(r",(\s*[\]\}])", r"\1", texto)   # comas colgando
    return json.loads(texto)


def _redondear(x):
    """Math.round de JavaScript: el .5 va para arriba (round() de Python no)."""
    return int(math.floor(x + 0.5))


def _dibujar(datos, idioma, raiz):
    L = TEXTOS["es" if idioma == "es" else "en"]
    partes = []
    for pack in datos.get("packs", []):
        total = pack.get("total") or 1
        modelos = pack.get("models", [])
        suma = 0
        filas = []
        for m in modelos:
            pct = max(0, min(100, _redondear(m.get("steps", 0) / total * 100)))
            suma += pct
            cls = "done" if pct >= 100 else ("" if pct > 0 else "pending")
            tag = L["done"] if pct >= 100 else (L["progress"] if pct > 0 else L["pending"])
            nombre = escape(m.get("name", ""))
            if m.get("img"):
                busca = "?v=" + escape(str(m["imgv"])) if m.get("imgv") else ""
                # width/height van SIEMPRE: reservan la caja aunque el CSS
                # todavia no haya llegado, asi la fila nunca cambia de alto.
                # El tamano final lo sigue mandando el CSS (54px en celular).
                ref = ('<img class="ks-prog-ref" src="' + raiz + "img/" +
                       escape(m["img"]) + busca + '" alt="' + nombre +
                       '" width="72" height="72" loading="lazy">')
            else:
                ref = '<span class="ks-prog-ref vacia"></span>'
            # Si el personaje tiene un video de prueba, va el link al lado de la
            # etiqueta. Se muestra tenga el estado que tenga: si hay test, se ve.
            vid = m.get("video", "")
            enlace = ""
            if vid:
                enlace = ('<a class="ks-prog-video" target="_blank" rel="noopener" '
                          'href="https://www.youtube.com/watch?v=' + escape(str(vid)) +
                          '" aria-label="' + escape(L["video"]) + " - " + nombre + '">' +
                          PLAY + '<span class="ks-prog-video-largo">' +
                          escape(L["video"]) + '</span>'
                          '<span class="ks-prog-video-corto">' +
                          escape(L["video_corto"]) + "</span></a>")
            # Boton de reaccion. Se dibuja aca, en el HTML, para que ocupe su
            # lugar desde el primer pintado: si lo agregara el JS, la fila
            # cambiaria de ancho al cargar. Nace deshabilitado y lo habilita
            # reacciones.js recien cuando pudo traer los numeros; si el
            # servicio no responde, queda apagado en vez de fallar al tocarlo.
            boton = ('<button class="ks-react" type="button" disabled'
                     ' data-personaje="' + _slug(m.get("name", "")) + '"'
                     ' aria-label="' + escape(L["reaccion"]) + " - " + nombre + '">' +
                     CORAZON + '<span class="ks-react-n"></span></button>')
            filas.append(
                '<div class="ks-prog-row">' + ref +
                '<div class="ks-prog-body">'
                '<div class="ks-prog-head">'
                "<span>" + nombre + "</span>"
                '<span class="ks-prog-tag ' + cls + '">' + escape(tag) + "</span>" +
                enlace + boton +
                '<span class="ks-prog-num">' + str(m.get("steps", 0)) + " / " +
                str(total) + " " + L["steps"] + "</span>"
                "</div>"
                '<div class="ks-prog-bar"><div class="ks-prog-fill ' + cls +
                '" style="width:' + str(pct) + '%"></div></div>'
                "</div></div>"
            )
        pack_pct = _redondear(suma / len(modelos)) if modelos else 0
        nota = pack.get("note_es") or pack.get("note", "") if idioma == "es" \
            else pack.get("note", "")
        partes.append(
            '<div class="ks-prog-pack">'
            '<div class="ks-prog-title"><h3>' + escape(pack.get("name", "")) +
            "</h3><b>" + str(pack_pct) + "%</b></div>" +
            ("<p>" + escape(nota) + "</p>" if nota else "") +
            "".join(filas) +
            "</div>"
        )
    partes.append('<p class="ks-prog-updated">' + L["updated"] + ": " +
                  escape(str(datos.get("updated", ""))) + "</p>")
    return "".join(partes)


def on_page_content(html, page, config, files, **kwargs):
    if MARCA not in html:
        return html
    try:
        datos = _leer_datos(config["docs_dir"])
        if not datos:
            return html
        ruta = page.file.src_uri if hasattr(page.file, "src_uri") else page.file.src_path
        idioma = "es" if ruta.replace("\\", "/").startswith("es/") else "en"
        # La raiz se saca del archivo DE SALIDA, no de page.file.url: con el
        # plugin i18n la pagina en espanol sale en es/progress/index.html pero
        # su url sigue siendo "progress/", y ahi faltaba un ../ en las fotos.
        salida = page.file.dest_uri if hasattr(page.file, "dest_uri") else page.file.dest_path
        tramos = salida.replace("\\", "/").split("/")[:-1]      # sin index.html
        raiz = "../" * len(tramos) if tramos else ""
        cuerpo = _dibujar(datos, idioma, raiz)
    except Exception as e:                                  # noqa: BLE001
        # Si algo sale mal dejamos el div vacio: progress.js lo llena igual.
        print("  [prerender_progress] sin pre-dibujar (" + str(e) + ")")
        return html
    return html.replace(MARCA, '<div id="ks-progress" data-done="1">' + cuerpo + "</div>")
