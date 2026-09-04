# -*- coding: utf-8 -*-
"""
Numeros que se buscan AFUERA al compilar: suscriptores de YouTube y cuantas
cosas hay publicadas en el Workshop de Steam.

Quedan escritos en el HTML, asi que para el visitante no hay ningun pedido
extra ni riesgo de que la pagina se mueva al cargar: cuando la ve, el numero
ya esta. Se refrescan al publicar, y ademas una vez por dia solos, con la
tarea automatica de GitHub (.github/workflows).

Si una consulta falla -el servicio se cae, no hay internet, Steam cambia el
HTML- se usa el ultimo valor guardado en contadores-cache.json y el sitio
compila igual. Nunca se rompe una publicacion por esto, y nunca queda un
hueco en la tarjeta: si tampoco hay valor guardado, la linea no se muestra.
"""

import os
import re
import json
import urllib.request

CACHE = "contadores-cache.json"      # en la raiz del proyecto
ESPERA = 10                          # segundos por consulta
NAVEGADOR = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
             "(KHTML, like Gecko) Chrome/120.0 Safari/537.36")

CANAL_YT = "UCkH-xqSgGMWpOKX9ptm_MKw"                      # youtube.com/@KSBravo
FUENTE_YT = "https://api.socialcounts.org/youtube-live-subscriber-count/" + CANAL_YT
# El feed publico del canal: los 15 videos mas nuevos, sin clave de API.
FEED_YT = "https://www.youtube.com/feeds/videos.xml?channel_id=" + CANAL_YT
# La misma pagina publica que enlaza la tarjeta. Steam escribe ahi
# "Showing 1-9 of 39 entries"; de ahi sale el total.
FUENTE_WS = "https://steamcommunity.com/id/KSBravo/myworkshopfiles/"

_memoria = {}                        # una sola consulta de cada cosa por compilacion


# ------------------------------------------------------------------ #
#  Cache en disco
# ------------------------------------------------------------------ #
def _cache_leer(raiz):
    try:
        with open(os.path.join(raiz, CACHE), encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def _cache_escribir(raiz, clave, valor):
    d = _cache_leer(raiz)
    d[clave] = valor
    try:
        with open(os.path.join(raiz, CACHE), "w", encoding="utf-8") as f:
            json.dump(d, f, indent=2, sort_keys=True)
            f.write("\n")
    except Exception:
        pass                          # que no falle el build por el cache


def _bajar(url):
    pedido = urllib.request.Request(url, headers={"User-Agent": NAVEGADOR})
    with urllib.request.urlopen(pedido, timeout=ESPERA) as r:
        return r.read().decode("utf-8", "replace")


# ------------------------------------------------------------------ #
#  Las dos consultas
# ------------------------------------------------------------------ #
def _traer_youtube():
    datos = json.loads(_bajar(FUENTE_YT))
    return int(datos["counters"]["api"]["subscriberCount"])


def _traer_workshop():
    html = _bajar(FUENTE_WS)
    m = re.search(r"of\s+([\d,]+)\s+entries", html)
    if not m:
        raise ValueError("Steam no muestra el total; capaz cambio la pagina")
    return int(m.group(1).replace(",", ""))


CONSULTAS = {"youtube": _traer_youtube, "workshop": _traer_workshop}


def numero(raiz, clave):
    """El valor para mostrar, o None si no hay forma de saberlo."""
    if clave in _memoria:
        return _memoria[clave]
    try:
        n = CONSULTAS[clave]()
        if n <= 0:
            raise ValueError("vino un numero que no sirve: %r" % n)
        _cache_escribir(raiz, clave, n)
        print("  [contadores] %s: %d" % (clave, n))
    except Exception as e:                                    # noqa: BLE001
        n = _cache_leer(raiz).get(clave)
        print("  [contadores] %s fallo (%s); uso el guardado: %s" % (clave, e, n))
    _memoria[clave] = n
    return n


def formatear(n):
    """1234 -> 1,234."""
    return "{:,}".format(n)


# ------------------------------------------------------------------ #
#  El video mas nuevo del canal (para el "Ultimo showcase" de la portada)
# ------------------------------------------------------------------ #
def _traer_ultimo_video():
    """Primera <entry> del feed: la mas nueva. Devuelve id y titulo.

    Ojo con el orden de las etiquetas: dentro de cada <entry> el <yt:videoId>
    viene ANTES que el <title>. Si se buscan por separado en todo el XML se
    terminan cruzando el id de un video con el titulo de otro.
    """
    xml = _bajar(FEED_YT)
    trozos = xml.split("<entry>")
    if len(trozos) < 2:
        raise ValueError("el feed no trae videos")
    e = trozos[1]
    vid = re.search(r"<yt:videoId>([A-Za-z0-9_-]{11})</yt:videoId>", e)
    tit = re.search(r"<title>(.*?)</title>", e, flags=re.S)
    if not vid:
        raise ValueError("no encontre el id en la primera entrada")
    titulo = (tit.group(1) if tit else "").strip()
    for a, b in (("&amp;", "&"), ("&lt;", "<"), ("&gt;", ">"),
                 ("&quot;", '"'), ("&#39;", "'")):
        titulo = titulo.replace(a, b)
    return {"id": vid.group(1), "titulo": titulo}


def ultimo_video(raiz):
    """El video mas nuevo, o None si no hay forma de saberlo."""
    if "ultimo_video" in _memoria:
        return _memoria["ultimo_video"]
    try:
        v = _traer_ultimo_video()
        _cache_escribir(raiz, "ultimo_video", v)
        print("  [contadores] ultimo video: %s (%s)" % (v["titulo"], v["id"]))
    except Exception as e:                                    # noqa: BLE001
        v = _cache_leer(raiz).get("ultimo_video")
        print("  [contadores] ultimo video fallo (%s); uso el guardado: %s"
              % (e, (v or {}).get("id")))
    _memoria["ultimo_video"] = v
    return v
