/* Une con una linea los personajes que son EL MISMO en packs distintos.

   El caso real: Pellow esta en el Bonus Pack 01 y su version nueva esta en el
   Pack 22. Los dos se llaman igual, asi que sin esto parecen repetidos.

   POR QUE HACE FALTA JAVASCRIPT
   Las dos filas viven en tarjetas distintas, con otro pack entero en el medio.
   El CSS no puede dibujar nada entre dos elementos que no comparten padre, asi
   que la altura de la linea se mide aca y se escribe a mano.

   NADA DE ESTO MUEVE LA PAGINA. El margen de la izquierda donde vive la linea
   lo reserva el CSS desde el primer pintado (la clase ks-con-vinculos ya viene
   en el HTML), y la linea se dibuja flotando por encima. Si este archivo no
   carga o falla, queda el margen vacio y no se rompe nada.

   En pantallas angostas no se dibuja: las dos filas quedan tan lejos una de la
   otra que la linea no se ve entera y solo comeria ancho. Lo decide el CSS. */
(function () {
  "use strict";

  var ALTO_MINIMO = 90;      // debajo de esto no entra el texto vertical
  var cont = null;
  var vinculos = [];

  function armar() {
    cont = document.getElementById("ks-progress");
    if (!cont || !cont.classList.contains("ks-con-vinculos")) { return false; }

    var grupos = {};
    [].slice.call(cont.querySelectorAll("[data-grupo]")).forEach(function (fila) {
      var g = fila.getAttribute("data-grupo");
      if (!grupos[g]) { grupos[g] = []; }
      grupos[g].push(fila);
    });

    var texto = cont.getAttribute("data-mismo") || "";
    Object.keys(grupos).forEach(function (g) {
      var filas = grupos[g];
      if (filas.length < 2) { return; }        // uno solo no se une con nadie
      var caja = document.createElement("div");
      caja.className = "ks-vinculo";
      caja.setAttribute("aria-hidden", "true");   // es decoracion: el lector de
      caja.innerHTML = '<span class="ks-vinculo-txt"></span>';  // pantalla la saltea
      caja.firstChild.textContent = texto;
      cont.appendChild(caja);
      vinculos.push({
        caja: caja,
        desde: filas[0],
        hasta: filas[filas.length - 1],
      });
    });
    return vinculos.length > 0;
  }

  function medir() {
    var base = cont.getBoundingClientRect();
    vinculos.forEach(function (v) {
      var a = v.desde.getBoundingClientRect();
      var b = v.hasta.getBoundingClientRect();
      // De centro a centro de cada fila, no de borde a borde: asi la linea
      // apunta al personaje y no al aire entre dos filas.
      var arriba = a.top + a.height / 2 - base.top;
      var alto = (b.top + b.height / 2 - base.top) - arriba;
      if (alto <= 0) { caja_oculta(v); return; }
      v.caja.style.top = arriba + "px";
      v.caja.style.height = alto + "px";
      v.caja.classList.add("visible");
      // Si la linea quedo corta, el texto no entra y sale cortado: se deja
      // sola la linea, que igual dice que las dos filas van juntas.
      v.caja.classList.toggle("sin-texto", alto < ALTO_MINIMO);
    });
  }

  function caja_oculta(v) { v.caja.classList.remove("visible"); }

  function arrancar() {
    if (!armar()) { return; }
    medir();

    // Las fotos llegan despues y corren las filas hacia abajo; el ancho de la
    // ventana tambien las mueve. Se vuelve a medir cuando pasa cualquiera de
    // las dos cosas, y no en cada cuadro: alcanza con hacerlo al final.
    var pendiente = null;
    function remedir() {
      if (pendiente) { cancelAnimationFrame(pendiente); }
      pendiente = requestAnimationFrame(function () {
        pendiente = null;
        medir();
      });
    }
    window.addEventListener("resize", remedir);
    window.addEventListener("load", remedir);
    if (window.ResizeObserver) {
      new ResizeObserver(remedir).observe(cont);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", arrancar);
  } else {
    arrancar();
  }
})();
