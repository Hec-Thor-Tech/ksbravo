# -*- coding: utf-8 -*-
"""
Hook de MkDocs: versionado de extra_css / extra_javascript.

MkDocs ya le pone un hash a sus propios assets, pero no a los que agregamos
nosotros (extra.css, parallax.js, progress-data.js...). Como el nombre nunca
cambia, el navegador se queda con la copia vieja y hay que hacer Ctrl+F5.

Este hook, al compilar, le agrega ?v=<hash del contenido> a cada uno. Si el
archivo cambia, cambia la URL y el navegador lo baja de nuevo solo. Si no
cambia, la URL queda igual y se sigue aprovechando la cache.

Se activa desde mkdocs.yml (hooks: - hooks/cache_bust.py). No toca nada de
lo que maneja el Gestor Web.
"""

import os
import hashlib


def _hash(ruta):
    with open(ruta, "rb") as f:
        return hashlib.md5(f.read()).hexdigest()[:8]


def _versionar(lista, docs_dir):
    salida = []
    for item in lista:
        # Material representa cada entrada como objeto con .value
        valor = item.value if hasattr(item, "value") else item
        limpio = valor.split("?")[0]
        ruta = os.path.join(docs_dir, limpio)
        if os.path.isfile(ruta) and "://" not in limpio:
            nuevo = limpio + "?v=" + _hash(ruta)
        else:
            nuevo = valor
        if hasattr(item, "value"):
            item.value = nuevo
            salida.append(item)
        else:
            salida.append(nuevo)
    return salida


def on_config(config):
    docs_dir = config["docs_dir"]
    config["extra_css"] = _versionar(config["extra_css"], docs_dir)
    config["extra_javascript"] = _versionar(config["extra_javascript"], docs_dir)
    return config
