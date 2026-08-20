/* Dibuja las barras de progreso desde progress-data.js.
   No se toca para actualizar: los datos viven en progress-data.js. */
(function () {
  function render() {
    var cont = document.getElementById("ks-progress");
    if (!cont || !window.KS_PROGRESS) { return; }
    if (cont.dataset.done) { return; }
    cont.dataset.done = "1";

    var es = (document.documentElement.lang || "en").indexOf("es") === 0;
    var L = es
      ? { steps: "pasos", updated: "Actualizado", done: "Terminado",
          progress: "En progreso", pending: "En cola" }
      : { steps: "steps", updated: "Last updated", done: "Done",
          progress: "In progress", pending: "Queued" };

    var d = window.KS_PROGRESS;
    var html = "";

    // Raiz del sitio, sacada del CSS del tema: sirve igual en / y en /es/,
    // y no se rompe si el sitio vuelve a vivir en un subdirectorio.
    var css = document.querySelector('link[href*="stylesheets/extra.css"]');
    var raiz = css ? css.href.replace(/stylesheets\/extra\.css.*$/, "") : "/";

    d.packs.forEach(function (pack) {
      var totalPct = 0;
      var rows = "";
      pack.models.forEach(function (m) {
        var pct = Math.max(0, Math.min(100, Math.round(m.steps / pack.total * 100)));
        totalPct += pct;
        var cls = pct >= 100 ? "done" : (pct > 0 ? "" : "pending");
        var tag = pct >= 100 ? L.done : (pct > 0 ? L.progress : L.pending);
        // imgv = sello de version que pone el Gestor (fecha del archivo):
        // cambia cuando se reemplaza la foto y el navegador baja la nueva
        // en vez de mostrar la vieja del cache.
        var busca = m.imgv ? "?v=" + m.imgv : "";
        var ref = m.img
          ? '<img class="ks-prog-ref" src="' + raiz + "img/" + m.img + busca +
            '" alt="' + m.name + '" loading="lazy">'
          : '<span class="ks-prog-ref vacia"></span>';
        rows +=
          '<div class="ks-prog-row">' +
            ref +
            '<div class="ks-prog-body">' +
              '<div class="ks-prog-head">' +
                "<span>" + m.name + "</span>" +
                '<span class="ks-prog-tag ' + cls + '">' + tag + "</span>" +
                '<span class="ks-prog-num">' + m.steps + " / " + pack.total + " " + L.steps + "</span>" +
              "</div>" +
              '<div class="ks-prog-bar"><div class="ks-prog-fill ' + cls + '" style="width:' + pct + '%"></div></div>' +
            "</div>" +
          "</div>";
      });
      var packPct = pack.models.length ? Math.round(totalPct / pack.models.length) : 0;
      var note = es ? (pack.note_es || pack.note || "") : (pack.note || "");
      html +=
        '<div class="ks-prog-pack">' +
          '<div class="ks-prog-title"><h3>' + pack.name + "</h3><b>" + packPct + "%</b></div>" +
          (note ? "<p>" + note + "</p>" : "") +
          rows +
        "</div>";
    });

    html += '<p class="ks-prog-updated">' + L.updated + ": " + d.updated + "</p>";
    cont.innerHTML = html;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
})();
