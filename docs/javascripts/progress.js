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

    d.packs.forEach(function (pack) {
      var totalPct = 0;
      var rows = "";
      pack.models.forEach(function (m) {
        var pct = Math.max(0, Math.min(100, Math.round(m.steps / pack.total * 100)));
        totalPct += pct;
        var cls = pct >= 100 ? "done" : (pct > 0 ? "" : "pending");
        var tag = pct >= 100 ? L.done : (pct > 0 ? L.progress : L.pending);
        rows +=
          '<div class="ks-prog-row">' +
            '<div class="ks-prog-head">' +
              "<span>" + m.name + "</span>" +
              '<span class="ks-prog-tag ' + cls + '">' + tag + "</span>" +
              '<span class="ks-prog-num">' + m.steps + " / " + pack.total + " " + L.steps + "</span>" +
            "</div>" +
            '<div class="ks-prog-bar"><div class="ks-prog-fill ' + cls + '" style="width:' + pct + '%"></div></div>' +
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
