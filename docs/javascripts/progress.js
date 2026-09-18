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
          progress: "En progreso", pending: "En cola",
          video: "Ver test en YouTube", videoCorto: "Test", paused: "Pausado",
          mismo: "El mismo personaje" }
      : { steps: "steps", updated: "Last updated", done: "Done",
          progress: "In progress", pending: "Queued",
          video: "Watch the test on YouTube", videoCorto: "Test", paused: "Paused",
          mismo: "Same character" };

    var PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true">' +
               '<path d="M8 5v14l11-7z"/></svg>';
    // Las dos barritas de pausa, para la etiqueta de un pack frenado.
    var PAUSA = '<svg class="ks-icono-pausa" viewBox="0 0 24 24" aria-hidden="true">' +
                '<path d="M7 5h3.2v14H7zM13.8 5H17v14h-3.2z"/></svg>';
    // Eslabon de cadena, para el cartelito de "el mismo personaje" en celular.
    var ENLACE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 7h-4v2h4c1.65 0 3 ' +
                 '1.35 3 3s-1.35 3-3 3h-4v2h4c2.76 0 5-2.24 5-5s-2.24-5-5-5zm-6 8H7c-1.65 ' +
                 '0-3-1.35-3-3s1.35-3 3-3h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-2zM8 11h8v2H8v-2z"/>' +
                 "</svg>";

    var d = window.KS_PROGRESS;
    var html = "";

    // Raiz del sitio, sacada del CSS del tema: sirve igual en / y en /es/,
    // y no se rompe si el sitio vuelve a vivir en un subdirectorio.
    var css = document.querySelector('link[href*="stylesheets/extra.css"]');
    var raiz = css ? css.href.replace(/stylesheets\/extra\.css.*$/, "") : "/";

    d.packs.forEach(function (pack) {
      var pausado = !!pack.paused;
      var totalPct = 0;
      var rows = "";
      pack.models.forEach(function (m) {
        var pct = Math.max(0, Math.min(100, Math.round(m.steps / pack.total * 100)));
        totalPct += pct;
        var cls = pct >= 100 ? "done" : (pct > 0 ? "" : "pending");
        var tag = pct >= 100 ? L.done : (pct > 0 ? L.progress : L.pending);
        // Pack frenado: lo que no esta terminado dice pausa, no "en progreso".
        var clsTag = cls, tagHtml = tag;
        if (pausado && pct < 100) { clsTag = "pausado"; tagHtml = PAUSA + L.paused; }
        // imgv = sello de version que pone el Gestor (fecha del archivo):
        // cambia cuando se reemplaza la foto y el navegador baja la nueva
        // en vez de mostrar la vieja del cache.
        var busca = m.imgv ? "?v=" + m.imgv : "";
        // width/height igual que en el hook que pre-dibuja: reservan la caja
        // para que la fila no cambie de alto cuando llega la foto.
        var ref = m.img
          ? '<img class="ks-prog-ref" src="' + raiz + "img/" + m.img + busca +
            '" alt="' + m.name + '" width="72" height="72" loading="lazy">'
          : '<span class="ks-prog-ref vacia"></span>';
        // Si el personaje tiene un test grabado, el link va al lado de la
        // etiqueta de estado. El id lo escribe el Gestor Web.
        var enlace = m.video
          ? '<a class="ks-prog-video" target="_blank" rel="noopener" href="' +
            "https://www.youtube.com/watch?v=" + m.video + '" aria-label="' +
            L.video + " - " + m.name + '">' + PLAY +
            '<span class="ks-prog-video-largo">' + L.video + "</span>" +
            '<span class="ks-prog-video-corto">' + L.videoCorto + "</span></a>"
          : "";
        // Personajes que son EL MISMO en packs distintos: la marca la lee
        // vinculos.js para dibujar la linea que los une.
        var marca = m.group ? ' data-grupo="' + m.group + '"' : "";
        // En celular la linea no se dibuja: el aviso va adentro de la fila.
        var nota = m.group
          ? '<span class="ks-mismo-nota">' + ENLACE + L.mismo + "</span>" : "";
        rows +=
          '<div class="ks-prog-row"' + marca + '>' +
            ref +
            '<div class="ks-prog-body">' +
              '<div class="ks-prog-head">' +
                "<span>" + m.name + "</span>" +
                '<span class="ks-prog-tag ' + clsTag + '">' + tagHtml + "</span>" +
                enlace +
                '<span class="ks-prog-num">' + m.steps + " / " + pack.total + " " + L.steps + "</span>" +
              "</div>" + nota +
              '<div class="ks-prog-bar"><div class="ks-prog-fill ' + cls + '" style="width:' + pct + '%"></div></div>' +
            "</div>" +
          "</div>";
      });
      var packPct = pack.models.length ? Math.round(totalPct / pack.models.length) : 0;
      var note = es ? (pack.note_es || pack.note || "") : (pack.note || "");
      // Sello de pausa: mismo criterio que el hook que pre-dibuja la pagina.
      var sello = pack.paused ? '<span class="ks-prog-sello">' + L.paused + "</span>" : "";
      html +=
        '<div class="ks-prog-pack' + (pack.paused ? " pausado" : "") + '">' +
          '<div class="ks-prog-title"><h3>' + pack.name + "</h3>" + sello +
            "<b>" + packPct + "%</b></div>" +
          (note ? "<p>" + note + "</p>" : "") +
          rows +
        "</div>";
    });

    html += '<p class="ks-prog-updated">' + L.updated + ": " + d.updated + "</p>";
    cont.innerHTML = html;

    // Mismas marcas que pone el hook que pre-dibuja, para que vinculos.js
    // encuentre lo que necesita tambien por este camino.
    if (cont.querySelector("[data-grupo]")) {
      cont.classList.add("ks-con-vinculos");
      cont.setAttribute("data-mismo", L.mismo);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
})();
