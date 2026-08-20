/* Fondo con paralaje AL SCROLLEAR. Los 4 niveles los dibujó Héctor:
   0 = cielo (no se mueve) · 1 = la luna graciosa · 2 = paisaje lejano ·
   3 = paisaje cercano. Cuanto más cerca, más se desplaza.

   Antes esto seguía al cursor y mareaba, así que ahora se mueve con la rueda:
   el movimiento acompaña algo que la persona ya está haciendo.

   El recorrido es un RANGO FIJO en px repartido sobre todo el scroll de la
   página, no un múltiplo de scrollY. Así una página larga no empuja las capas
   fuera del contenedor, y en una corta el efecto igual se nota. */
(function () {
  var quietud = window.matchMedia("(prefers-reduced-motion: reduce)");

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

    // px totales que recorre cada nivel entre el principio y el final de la página
    var RANGO = [0, 16, 38, 76];
    var pedido = false;

    function pintar() {
      pedido = false;
      var doc = document.documentElement;
      var scrolleable = (doc.scrollHeight - window.innerHeight) || 1;
      var avance = Math.min(1, Math.max(0, window.pageYOffset / scrolleable));
      for (var i = 1; i < capas.length; i++) {
        // negativo: al bajar, el fondo sube (más lento que el contenido)
        capas[i].style.transform =
          "translate3d(0," + (-avance * RANGO[i]).toFixed(2) + "px,0)";
      }
    }

    function alScrollear() {
      if (!pedido) { pedido = true; requestAnimationFrame(pintar); }
    }

    function encender() {
      window.addEventListener("scroll", alScrollear, { passive: true });
      window.addEventListener("resize", alScrollear, { passive: true });
      pintar();
    }

    function apagar() {
      window.removeEventListener("scroll", alScrollear);
      window.removeEventListener("resize", alScrollear);
      for (var i = 1; i < capas.length; i++) { capas[i].style.transform = ""; }
    }

    if (!quietud.matches) { encender(); }
    // si la persona cambia la preferencia del sistema, respetarlo en el momento
    // (Safari viejo no tiene addEventListener en MediaQueryList: no es critico)
    try {
      quietud.addEventListener("change", function (e) { e.matches ? apagar() : encender(); });
    } catch (err) { /* sin escucha de cambios, el estado inicial ya es correcto */ }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", armar);
  } else {
    armar();
  }
})();
