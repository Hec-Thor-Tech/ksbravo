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

El alto del reproductor lo reserva el CSS (.ks-video, con padding-bottom al
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
    # youtube-nocookie: no deja cookies de seguimiento hasta que la persona
    # le da play. Era asi antes y se mantiene.
    bloque = ('<div class="ks-video">'
              '<iframe src="https://www.youtube-nocookie.com/embed/' +
              escape(v["id"]) + '" title="' + escape(v.get("titulo", "")) +
              '" allowfullscreen loading="lazy"></iframe></div>')
    return html.replace(MARCA, bloque)
