/* Me gusta / no me gusta por personaje, en Trabajo en Progreso.

   Los botones ya vienen dibujados en el HTML y nacen DESHABILITADOS: este
   archivo solo les pone los numeros y los enciende. Asi la fila mide lo mismo
   desde el primer pintado y nada se mueve al cargar, que es la regla de esta
   pagina.

   Si el servicio no responde, los botones quedan apagados y no pasa nada mas:
   ni error a la vista, ni un boton que al tocarlo no haga nada.

   No pide iniciar sesion ni guarda datos de nadie. Del lado del navegador se
   recuerda que votaste, para pintar el boton y para no dejarte votar dos
   veces; del lado del servidor hay un segundo freno por conexion, porque lo
   del navegador se borra facil. Se puede cambiar de opinion: si votaste que si
   y despues tocas que no, se descuenta de un lado y se suma del otro. */
(function () {
  "use strict";

  var API = "https://ksbravo-reacciones.bravo-policiaciudad.workers.dev";
  var MEMORIA = "ks-reacciones";

  function misVotos() {
    try { return JSON.parse(localStorage.getItem(MEMORIA) || "{}") || {}; }
    catch (e) { return {}; }
  }

  function recordar(clave, tipo) {
    try {
      var v = misVotos();
      v[clave] = tipo;
      localStorage.setItem(MEMORIA, JSON.stringify(v));
    } catch (e) { /* modo incognito o storage lleno: no es grave */ }
  }

  function grupo(clave) {
    return [].slice.call(document.querySelectorAll(
      '.ks-react[data-personaje="' + clave + '"]'));
  }

  /** Pinta los dos botones de un personaje. */
  function pintar(clave, cuenta, miVoto) {
    grupo(clave).forEach(function (b) {
      var tipo = b.getAttribute("data-voto");
      b.querySelector(".ks-react-n").textContent = cuenta[tipo] || 0;
      b.classList.toggle("votado", miVoto === tipo);
    });
  }

  function arrancar() {
    var botones = [].slice.call(document.querySelectorAll(".ks-react"));
    if (!botones.length) { return; }

    fetch(API)
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (totales) {
        var mios = misVotos();
        var vistos = {};
        botones.forEach(function (b) {
          var clave = b.getAttribute("data-personaje");
          if (!vistos[clave]) {
            vistos[clave] = true;
            pintar(clave, totales[clave] || {}, mios[clave]);
          }
          b.disabled = false;
        });
      })
      .catch(function () {
        // Sin servicio: los botones se quedan como estan, apagados.
      });

    document.addEventListener("click", function (ev) {
      var b = ev.target.closest && ev.target.closest(".ks-react");
      if (!b || b.disabled) { return; }
      var clave = b.getAttribute("data-personaje");
      var tipo = b.getAttribute("data-voto");
      var mios = misVotos();
      if (mios[clave] === tipo) { return; }          // ya votaste eso mismo

      // Se actualiza en pantalla al instante: el que toca ve la respuesta ya,
      // aunque el servidor tarde. Si falla, se vuelve atras.
      var antes = {};
      grupo(clave).forEach(function (x) {
        antes[x.getAttribute("data-voto")] =
          parseInt(x.querySelector(".ks-react-n").textContent, 10) || 0;
      });
      var ahora = { like: antes.like, dislike: antes.dislike };
      ahora[tipo] += 1;
      if (mios[clave] && mios[clave] !== tipo) {
        ahora[mios[clave]] = Math.max(0, ahora[mios[clave]] - 1);
      }
      var votoAnterior = mios[clave];
      pintar(clave, ahora, tipo);
      recordar(clave, tipo);

      fetch(API + "/" + encodeURIComponent(clave) + "/" + tipo, { method: "POST" })
        .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
        .then(function (d) { pintar(clave, d, d.tuVoto); })
        .catch(function () {
          pintar(clave, antes, votoAnterior);
          recordar(clave, votoAnterior);
        });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", arrancar);
  } else {
    arrancar();
  }
})();
