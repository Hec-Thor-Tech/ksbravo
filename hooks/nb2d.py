import hashlib
import os

from mkdocs.utils import get_relative_url

MARCA_BASE = "__NB2D_BASE__"
MARCA_V = "__NB2D_V__"


def _version(docs_dir):
    carpeta = os.path.join(docs_dir, "javascripts", "nb2d")
    h = hashlib.md5()
    for fn in sorted(os.listdir(carpeta)):
        with open(os.path.join(carpeta, fn), "rb") as f:
            h.update(fn.encode("utf-8"))
            h.update(f.read())
    return h.hexdigest()[:8]


def on_page_content(html, page, config, files, **kwargs):
    if MARCA_BASE not in html and MARCA_V not in html:
        return html
    base = get_relative_url("javascripts/nb2d/app.js", page.url)[: -len("app.js")]
    return html.replace(MARCA_BASE, base).replace(MARCA_V, _version(config["docs_dir"]))
