---
title: Nextbot 2D Maker - KSBravo
description: Hacé un nextbot 2D para Garry's Mod con tu propia imagen, directo en el navegador. Tus archivos nunca salen de tu computadora.
---

# Nextbot 2D Maker

Convertí una imagen en un nextbot 2D para Garry's Mod. Elegí tu imagen, poné el nombre, el tamaño y los sonidos, y guardá el addon. Todo funciona en tu navegador: tus archivos nunca salen de tu computadora.

!!! warning "Requiere DrGBase"
    Sin DrGBase el nextbot no funciona. [Suscribite a DrGBase en el Workshop de Steam](https://steamcommunity.com/sharedfiles/filedetails/?id=1560118657){target=_blank rel=noopener}.

<div id="ks-nb2d" class="ks-nb2d">
<noscript><p>Esta herramienta necesita JavaScript activado.</p></noscript>
<div class="ks-nb2d-grid">
<section class="ks-nb2d-panel">
<h2 id="imagen">1. Imagen</h2>
<div class="ks-nb2d-elegir">
<input type="file" id="nb2d-imagen" class="ks-nb2d-oculto" accept=".png,.jpg,.jpeg,.webp,.gif,image/png,image/jpeg,image/webp,image/gif">
<label class="ks-btn" for="nb2d-imagen">Elegir imagen</label>
<span id="nb2d-nombre-img" class="ks-nb2d-archivo"></span>
</div>
<p class="ks-nb2d-ayuda">PNG, JPG, WEBP o GIF animado. Lo mejor es una imagen con fondo transparente.</p>
<label class="ks-nb2d-check"><input type="checkbox" id="nb2d-fondo"> Quitar fondo liso</label>
<p class="ks-nb2d-ayuda">Para imágenes con un color liso detrás del personaje.</p>
<canvas id="nb2d-vista" class="ks-nb2d-vista" width="520" height="322" role="img" aria-label="Vista previa al lado de un jugador de 72 unidades"></canvas>
<p id="nb2d-info" class="ks-nb2d-ayuda"></p>
</section>
<section class="ks-nb2d-panel">
<h2 id="datos">2. Datos</h2>
<label class="ks-nb2d-campo" for="nb2d-nombre">Nombre (menú Q)</label>
<input type="text" id="nb2d-nombre" value="My Nextbot" maxlength="64">
<label class="ks-nb2d-campo" for="nb2d-firma">Firma del autor</label>
<input type="text" id="nb2d-firma" value="" maxlength="16" autocomplete="off" spellcheck="false">
<p class="ks-nb2d-ayuda">Un código corto que hace único a tu nextbot, para que no choque con el nextbot de otra persona del mismo personaje. Usá la misma firma en todos tus nextbots.</p>
<label class="ks-nb2d-campo" for="nb2d-altura">Altura (unidades, jugador = 72)</label>
<div class="ks-nb2d-fila"><input type="range" id="nb2d-altura-rango" min="16" max="400" value="96" aria-label="Altura"><input type="number" id="nb2d-altura" min="8" max="4096" step="any" value="96"></div>
<label class="ks-nb2d-campo" for="nb2d-categoria">Categoría (menú Q)</label>
<input type="text" id="nb2d-categoria" value="2D Nextbots" maxlength="64">
<label class="ks-nb2d-campo" for="nb2d-salud">Vida</label>
<input type="number" id="nb2d-salud" min="1" max="10000000" step="100" value="10000">
<label class="ks-nb2d-campo" for="nb2d-velocidad">Velocidad al correr</label>
<input type="number" id="nb2d-velocidad" min="10" max="3000" step="10" value="500">
<label class="ks-nb2d-campo" for="nb2d-danio-min">Daño por golpe (mín. / máx.)</label>
<div class="ks-nb2d-fila"><input type="number" id="nb2d-danio-min" min="0" value="100"><input type="number" id="nb2d-danio-max" min="0" value="200" aria-label="Daño máximo por golpe"></div>
</section>
<section class="ks-nb2d-panel">
<h2 id="sonidos">3. Sonidos</h2>
<p class="ks-nb2d-ayuda">Todos opcionales. MP3, WAV u OGG.</p>
<div class="ks-nb2d-sonido"><span>Música de persecución (loop)</span><input type="file" id="nb2d-snd-panic" class="ks-nb2d-oculto" accept=".mp3,.wav,.ogg"><label class="ks-btn ghost" for="nb2d-snd-panic">Elegir</label><span id="nb2d-snd-panic-nombre" class="ks-nb2d-archivo"></span><button type="button" id="nb2d-snd-panic-quitar" class="ks-nb2d-x" hidden>Quitar</button></div>
<div class="ks-nb2d-sonido"><span>Al aparecer</span><input type="file" id="nb2d-snd-spawn" class="ks-nb2d-oculto" accept=".mp3,.wav,.ogg"><label class="ks-btn ghost" for="nb2d-snd-spawn">Elegir</label><span id="nb2d-snd-spawn-nombre" class="ks-nb2d-archivo"></span><button type="button" id="nb2d-snd-spawn-quitar" class="ks-nb2d-x" hidden>Quitar</button></div>
<div class="ks-nb2d-sonido"><span>Al matar (jumpscare)</span><input type="file" id="nb2d-snd-kill" class="ks-nb2d-oculto" accept=".mp3,.wav,.ogg"><label class="ks-btn ghost" for="nb2d-snd-kill">Elegir</label><span id="nb2d-snd-kill-nombre" class="ks-nb2d-archivo"></span><button type="button" id="nb2d-snd-kill-quitar" class="ks-nb2d-x" hidden>Quitar</button></div>
<div class="ks-nb2d-sonido"><span>Pisadas</span><input type="file" id="nb2d-snd-step" class="ks-nb2d-oculto" accept=".mp3,.wav,.ogg"><label class="ks-btn ghost" for="nb2d-snd-step">Elegir</label><span id="nb2d-snd-step-nombre" class="ks-nb2d-archivo"></span><button type="button" id="nb2d-snd-step-quitar" class="ks-nb2d-x" hidden>Quitar</button></div>
<div class="ks-nb2d-sonido"><span>Al morir</span><input type="file" id="nb2d-snd-death" class="ks-nb2d-oculto" accept=".mp3,.wav,.ogg"><label class="ks-btn ghost" for="nb2d-snd-death">Elegir</label><span id="nb2d-snd-death-nombre" class="ks-nb2d-archivo"></span><button type="button" id="nb2d-snd-death-quitar" class="ks-nb2d-x" hidden>Quitar</button></div>
<div class="ks-nb2d-sonido"><span>Cada tanto (idle)</span><input type="file" id="nb2d-snd-idle" class="ks-nb2d-oculto" accept=".mp3,.wav,.ogg"><label class="ks-btn ghost" for="nb2d-snd-idle">Elegir</label><span id="nb2d-snd-idle-nombre" class="ks-nb2d-archivo"></span><button type="button" id="nb2d-snd-idle-quitar" class="ks-nb2d-x" hidden>Quitar</button></div>
<div class="ks-nb2d-sonido"><span>Al golpear</span><input type="file" id="nb2d-snd-attack" class="ks-nb2d-oculto" accept=".mp3,.wav,.ogg"><label class="ks-btn ghost" for="nb2d-snd-attack">Elegir</label><span id="nb2d-snd-attack-nombre" class="ks-nb2d-archivo"></span><button type="button" id="nb2d-snd-attack-quitar" class="ks-nb2d-x" hidden>Quitar</button></div>
</section>
<section class="ks-nb2d-panel">
<h2 id="guardar">4. Guardar</h2>
<p class="ks-nb2d-botones"><button type="button" id="nb2d-guardar-carpeta" class="ks-btn">Guardar en Garry's Mod</button><button type="button" id="nb2d-guardar-zip" class="ks-btn ghost">Descargar ZIP</button></p>
<p id="nb2d-ayuda-carpeta" class="ks-nb2d-ayuda">Guardar en Garry's Mod: elegí tu carpeta garrysmod/addons. Suele estar en C:\Program Files (x86)\Steam\steamapps\common\GarrysMod\garrysmod\addons. El ZIP es el mismo addon, para guardarlo o compartirlo.</p>
<p id="nb2d-ayuda-otros" class="ks-nb2d-ayuda">Este navegador no puede escribir en carpetas, así que el addon sale en un ZIP. Descomprimilo dentro de garrysmod/addons. Para guardarlo directo en la carpeta, usá Chrome o Edge.</p>
<p id="nb2d-estado" class="ks-nb2d-estado" role="status" aria-live="polite"></p>
</section>
</div>
</div>
<script type="module" src="__NB2D_BASE__app.js?v=__NB2D_V__"></script>

## Compartirlo en el Workshop

Esta página no puede publicarlo por vos: para publicar hace falta Steam abierto en tu computadora. Usá las herramientas que vienen con Garry's Mod (gmad y gmpublish, en la carpeta GarrysMod/bin) o gmpublisher. El archivo LEEME que viene dentro del addon tiene los comandos.
