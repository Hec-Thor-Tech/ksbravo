/* Fondo con paralaje. Los 4 niveles los dibujó Héctor:
   0 = cielo (no se mueve) · 1 = la luna graciosa · 2 = paisaje lejano ·
   3 = paisaje cercano. Cuanto más cerca, más se corre con el cursor.

   No se mueve en pantallas táctiles (no hay cursor) ni si el sistema pide
   menos animación. El velo oscuro va ARRIBA de las capas para que el texto
   se siga leyendo. */
(function () {
  var conCursor = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var quietud = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function armar() {
    if (document.querySelector(".ks-bg")) { return; }

    // raíz del sitio sacada del CSS del tema: sirve en / y en /es/
    var css = document.querySelector('link[href*="stylesheets/extra.css"]');
    var raiz = css ? css.href.replace(/stylesheets\/extra\.css.*$/, "") : "/";

    var cont = document.createElement("div");
    cont.className = "ks-bg";
    cont.setAttribute("aria-hidden", "true");

    var capas = [];
    for (var i = 0; i < 4; i++) {
      var capa = document.createElement("div");
      capa.className = "ks-bg-capa";
      capa.style.backgroundImage = 'url("' + raiz + "img/bg" + i + '.webp")';
      cont.appendChild(capa);
      capas.push(capa);
    }
    var velo = document.createElement("div");
    velo.className = "ks-bg-velo";
    cont.appendChild(velo);

    document.body.insertBefore(cont, document.body.firstChild);

    if (!conCursor || quietud) { return; }

    // px que se corre cada nivel entre un borde y el otro de la pantalla
    var FUERZA = [0, 10, 24, 46];
    var destinoX = 0, destinoY = 0, actualX = 0, actualY = 0, animando = false;

    function pintar() {
      // suavizado: las capas persiguen al cursor en vez de saltar
      actualX += (destinoX - actualX) * 0.08;
      actualY += (destinoY - actualY) * 0.08;
      for (var i = 1; i < capas.length; i++) {
        capas[i].style.transform = "translate3d(" +
          (actualX * FUERZA[i]).toFixed(2) + "px," +
          (actualY * FUERZA[i] * 0.55).toFixed(2) + "px,0)";
      }
      if (Math.abs(destinoX - actualX) > 0.002 || Math.abs(destinoY - actualY) > 0.002) {
        requestAnimationFrame(pintar);
      } else {
        animando = false;
      }
    }

    window.addEventListener("mousemove", function (e) {
      destinoX = (e.clientX / window.innerWidth) * 2 - 1;   // -1 .. 1
      destinoY = (e.clientY / window.innerHeight) * 2 - 1;
      if (!animando) { animando = true; requestAnimationFrame(pintar); }
    }, { passive: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", armar);
  } else {
    armar();
  }
})();
