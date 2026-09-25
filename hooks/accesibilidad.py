# -*- coding: utf-8 -*-
"""
Hook de MkDocs: le pone nombre a la ventana del buscador.

El buscador de Material es una ventana (role="dialog") sin nombre, y los
lectores de pantalla anuncian solo "dialogo", sin decir para que es. Aca se le
agrega aria-label="Buscar" (o "Search" en la version en ingles) al HTML ya
armado. Si algun dia Material cambia ese pedazo de HTML, el reemplazo
simplemente no encuentra nada y la pagina sale igual que antes.
"""

BUSCADOR = 'class="md-search" data-md-component="search" role="dialog"'


def on_post_page(html, page, config, **kwargs):
    if BUSCADOR not in html:
        return html
    nombre = "Buscar" if '<html lang="es"' in html else "Search"
    return html.replace(BUSCADOR, BUSCADOR + ' aria-label="' + nombre + '"', 1)
