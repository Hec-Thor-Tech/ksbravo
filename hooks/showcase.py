# -*- coding: utf-8 -*-
"""
Hook de MkDocs: el "Ultimo showcase" de la portada.

Antes el video estaba escrito a mano en index.md, en los dos idiomas, con su
id Y su titulo. Habia que acordarse de cambiar cuatro cosas cada vez que subia
un video, asi que quedaba viejo: llego a mostrar uno de un mes atras.

Ahora la pagina escribe <!-- KS-SHOWCASE --> donde va el video, y este hook lo
reemplaza por el reproductor del video mas nuevo del canal, que se busca al
compilar. La tarea diaria de GitHub recompila sola, asi que la portada se
mantiene al dia sin que nadie toque nada.

Si la consulta falla se usa el ultimo video guardado en contadores-cache.json.
Si tampoco hay, no se dibuja nada: mejor un hueco que un reproductor roto.

El alto del bloque lo reserva el CSS (.ks-video, con padding-bottom al
56.25%), asi que aparecer o no aparecer nunca mueve el resto de la pagina.
"""

import os
import sys
from html import escape

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import contadores  # noqa: E402

MARCA = "<!-- KS-SHOWCASE -->"


def on_page_content(html, page, config, files, **kwargs):
    if MARCA not in html:
        return html
    raiz = os.path.dirname(config["docs_dir"])
    v = contadores.ultimo_video(raiz)
    if not v or not v.get("id"):
        print("  [showcase] sin video para mostrar")
        return html.replace(MARCA, "")
    # "Fachada": en vez del reproductor de YouTube (mas de 1 MB de scripts que
    # se bajaban aunque nadie le diera play) va la miniatura del video con un
    # boton de play. Recien al tocarla javascripts/video.js la cambia por el
    # reproductor de youtube-nocookie, que arranca solo. Sin JavaScript el
    # boton es un link comun al video en YouTube, asi que nunca queda roto.
    vid = escape(v["id"])
    titulo = escape(v.get("titulo", ""))
    bloque = ('<div class="ks-video">'
              '<a class="ks-video-cara" href="https://www.youtube.com/watch?v=' +
              vid + '" data-video="' + vid + '" data-titulo="' + titulo +
              '" target="_blank" rel="noopener" aria-label="Play: ' + titulo + '">'
              '<img src="https://i.ytimg.com/vi/' + vid + '/hqdefault.jpg" alt="" '
              'width="480" height="360" loading="lazy">'
              '<span class="ks-video-play" aria-hidden="true">'
              '<svg viewBox="0 0 68 48"><path d="M66.5 7.7a8.5 8.5 0 0 0-6-6C55.2.3 34 .3 34 .3S12.8.3 7.5 1.7a8.5 8.5 0 0 0-6 6C.2 13 .2 24 .2 24s0 11 1.3 16.3a8.5 8.5 0 0 0 6 6c5.3 1.4 26.5 1.4 26.5 1.4s21.2 0 26.5-1.4a8.5 8.5 0 0 0 6-6C67.8 35 67.8 24 67.8 24s0-11-1.3-16.3z" fill="#f00"/>'
              '<path d="M45 24 27 14v20z" fill="#fff"/></svg></span>'
              '<span class="ks-video-titulo">' + titulo + '</span>'
              '</a></div>')
    return html.replace(MARCA, bloque)
