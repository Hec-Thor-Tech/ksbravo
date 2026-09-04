/* Reacciones por personaje ("me gusta") en Trabajo en Progreso.

   El boton ya viene dibujado en el HTML y nace DESHABILITADO: este archivo
   solo le pone los numeros y lo enciende. Asi la fila mide lo mismo desde el
   primer pintado y nada se mueve al cargar, que es la regla de esta pagina.

   Si el servicio no responde, los botones quedan apagados y no pasa nada mas:
   ni error a la vista, ni un boton que al tocarlo no haga nada.

   No pide iniciar sesion ni guarda datos de nadie. Del lado del navegador se
   recuerda en localStorage a quien votaste, solo para no dejarte votar dos
   veces al mismo y para pintar el corazon; del lado del servidor hay un
   segundo freno por conexion, porque el localStorage se borra facil. */
(function () {
  "use strict";

  var API = "https://ksbravo-reacciones.bravo-policiaciudad.workers.dev";
  var MEMORIA = "ks-reacciones-votadas";

  function votadas() {
    try { return JSON.parse(localStorage.getItem(MEMORIA) || "[]"); }
    catch (e) { return []; }
  }

  function recordar(clave) {
    try {
      var v = votadas();
      if (v.indexOf(clave) < 0) { v.push(clave); }
      localStorage.setItem(MEMORIA, JSON.stringify(v));
    } catch (e) { /* modo incognito o storage lleno: no es grave */ }
  }

  function pintar(boton, total, yaVoto) {
    boton.querySelector(".ks-react-n").textContent = total > 0 ? total : "";
    boton.classList.toggle("votado", !!yaVoto);
    if (yaVoto) {
      boton.disabled = true;
      boton.title = boton.getAttribute("data-gracias") || "";
    }
  }

  function arrancar() {
    var botones = [].slice.call(document.querySelectorAll(".ks-react"));
    if (!botones.length) { return; }

    fetch(API, { method: "GET" })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (totales) {
        var yaVote = votadas();
        botones.forEach(function (b) {
          var clave = b.getAttribute("data-personaje");
          var mio = yaVote.indexOf(clave) >= 0;
          pintar(b, totales[clave] || 0, mio);
          if (!mio) { b.disabled = false; }
        });
      })
      .catch(function () {
        // Sin servicio: los botones se quedan como estan, apagados.
      });

    document.addEventListener("click", function (ev) {
      var b = ev.target.closest && ev.target.closest(".ks-react");
      if (!b || b.disabled) { return; }
      var clave = b.getAttribute("data-personaje");

      // Se suma en pantalla al instante: el que toca ve la respuesta ya, aunque
      // el servidor tarde. Si falla, se vuelve atras.
      var span = b.querySelector(".ks-react-n");
      var antes = parseInt(span.textContent, 10) || 0;
      pintar(b, antes + 1, true);
      recordar(clave);

      fetch(API + "/" + encodeURIComponent(clave), { method: "POST" })
        .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
        .then(function (d) { pintar(b, d.total, true); })
        .catch(function () { pintar(b, antes, false); b.disabled = false; });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", arrancar);
  } else {
    arrancar();
  }
})();
