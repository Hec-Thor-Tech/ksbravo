/* "Ultimo showcase" de la portada: al tocar la miniatura se pone el
   reproductor de YouTube en su lugar.

   La pagina trae solo la foto del video (la dibuja hooks/showcase.py). El
   reproductor de verdad pesa mas de 1 MB y antes se bajaba siempre, aunque
   nadie mirara el video; ahora se baja recien cuando alguien le da play.
   Si este archivo no carga, el boton sigue siendo un link al video. */
(function () {
  "use strict";

  document.addEventListener("click", function (ev) {
    var cara = ev.target.closest && ev.target.closest(".ks-video-cara");
    if (!cara) { return; }
    var id = cara.getAttribute("data-video");
    if (!/^[A-Za-z0-9_-]{11}$/.test(id || "")) { return; }   // que sea un id valido
    ev.preventDefault();

    var marco = document.createElement("iframe");
    marco.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1";
    marco.title = cara.getAttribute("data-titulo") || "YouTube";
    marco.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    marco.setAttribute("allowfullscreen", "");
    cara.parentNode.replaceChild(marco, cara);
    marco.focus();
  });
})();
