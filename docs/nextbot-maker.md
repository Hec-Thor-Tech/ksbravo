---
title: Nextbot 2D Maker - KSBravo
description: Make a 2D nextbot for Garry's Mod from your own image, right in your browser. Your files never leave your computer.
---

# Nextbot 2D Maker

Turn an image into a 2D nextbot for Garry's Mod. Pick your image, set the name, size and sounds, and save the addon. Everything runs in your browser: your files never leave your computer.

!!! warning "Requires DrGBase"
    The nextbot will not work without it. [Subscribe to DrGBase on the Steam Workshop](https://steamcommunity.com/sharedfiles/filedetails/?id=1560118657){target=_blank rel=noopener}.

<div id="ks-nb2d" class="ks-nb2d">
<noscript><p>This tool needs JavaScript turned on.</p></noscript>
<div class="ks-nb2d-grid">
<section class="ks-nb2d-panel">
<h2 id="image">1. Image</h2>
<div class="ks-nb2d-elegir">
<input type="file" id="nb2d-imagen" class="ks-nb2d-oculto" accept=".png,.jpg,.jpeg,.webp,.gif,image/png,image/jpeg,image/webp,image/gif">
<label class="ks-btn" for="nb2d-imagen">Choose image</label>
<span id="nb2d-nombre-img" class="ks-nb2d-archivo"></span>
</div>
<p class="ks-nb2d-ayuda">PNG, JPG, WEBP or animated GIF. A transparent background works best.</p>
<label class="ks-nb2d-check"><input type="checkbox" id="nb2d-fondo"> Remove plain background</label>
<p class="ks-nb2d-ayuda">For images with a solid color behind the character.</p>
<canvas id="nb2d-vista" class="ks-nb2d-vista" width="520" height="322" role="img" aria-label="Preview next to a 72 unit player"></canvas>
<p id="nb2d-info" class="ks-nb2d-ayuda"></p>
</section>
<section class="ks-nb2d-panel">
<h2 id="details">2. Details</h2>
<label class="ks-nb2d-campo" for="nb2d-nombre">Name (Q menu)</label>
<input type="text" id="nb2d-nombre" value="My Nextbot" maxlength="64">
<label class="ks-nb2d-campo" for="nb2d-firma">Author tag</label>
<input type="text" id="nb2d-firma" value="" maxlength="16" autocomplete="off" spellcheck="false">
<p class="ks-nb2d-ayuda">A short code that makes your nextbot unique, so it does not clash with someone else's nextbot of the same character. Use the same tag for all your nextbots.</p>
<label class="ks-nb2d-campo" for="nb2d-altura">Height (units, player = 72)</label>
<div class="ks-nb2d-fila"><input type="range" id="nb2d-altura-rango" min="16" max="400" value="96" aria-label="Height"><input type="number" id="nb2d-altura" min="8" max="4096" step="any" value="96"></div>
<label class="ks-nb2d-campo" for="nb2d-categoria">Category (Q menu)</label>
<input type="text" id="nb2d-categoria" value="2D Nextbots" maxlength="64">
<label class="ks-nb2d-campo" for="nb2d-salud">Health</label>
<input type="number" id="nb2d-salud" min="1" max="10000000" step="100" value="10000">
<label class="ks-nb2d-campo" for="nb2d-velocidad">Run speed</label>
<input type="number" id="nb2d-velocidad" min="10" max="3000" step="10" value="500">
<label class="ks-nb2d-campo" for="nb2d-danio-min">Damage per hit (min / max)</label>
<div class="ks-nb2d-fila"><input type="number" id="nb2d-danio-min" min="0" value="100"><input type="number" id="nb2d-danio-max" min="0" value="200" aria-label="Maximum damage per hit"></div>
</section>
<section class="ks-nb2d-panel">
<h2 id="sounds">3. Sounds</h2>
<p class="ks-nb2d-ayuda">All optional. MP3, WAV or OGG.</p>
<div class="ks-nb2d-sonido"><span>Chase music (loop)</span><input type="file" id="nb2d-snd-panic" class="ks-nb2d-oculto" accept=".mp3,.wav,.ogg"><label class="ks-btn ghost" for="nb2d-snd-panic">Choose</label><span id="nb2d-snd-panic-nombre" class="ks-nb2d-archivo"></span><button type="button" id="nb2d-snd-panic-quitar" class="ks-nb2d-x" hidden>Remove</button></div>
<div class="ks-nb2d-sonido"><span>On spawn</span><input type="file" id="nb2d-snd-spawn" class="ks-nb2d-oculto" accept=".mp3,.wav,.ogg"><label class="ks-btn ghost" for="nb2d-snd-spawn">Choose</label><span id="nb2d-snd-spawn-nombre" class="ks-nb2d-archivo"></span><button type="button" id="nb2d-snd-spawn-quitar" class="ks-nb2d-x" hidden>Remove</button></div>
<div class="ks-nb2d-sonido"><span>On kill (jumpscare)</span><input type="file" id="nb2d-snd-kill" class="ks-nb2d-oculto" accept=".mp3,.wav,.ogg"><label class="ks-btn ghost" for="nb2d-snd-kill">Choose</label><span id="nb2d-snd-kill-nombre" class="ks-nb2d-archivo"></span><button type="button" id="nb2d-snd-kill-quitar" class="ks-nb2d-x" hidden>Remove</button></div>
<div class="ks-nb2d-sonido"><span>Footsteps</span><input type="file" id="nb2d-snd-step" class="ks-nb2d-oculto" accept=".mp3,.wav,.ogg"><label class="ks-btn ghost" for="nb2d-snd-step">Choose</label><span id="nb2d-snd-step-nombre" class="ks-nb2d-archivo"></span><button type="button" id="nb2d-snd-step-quitar" class="ks-nb2d-x" hidden>Remove</button></div>
<div class="ks-nb2d-sonido"><span>On death</span><input type="file" id="nb2d-snd-death" class="ks-nb2d-oculto" accept=".mp3,.wav,.ogg"><label class="ks-btn ghost" for="nb2d-snd-death">Choose</label><span id="nb2d-snd-death-nombre" class="ks-nb2d-archivo"></span><button type="button" id="nb2d-snd-death-quitar" class="ks-nb2d-x" hidden>Remove</button></div>
<div class="ks-nb2d-sonido"><span>Idle taunt</span><input type="file" id="nb2d-snd-idle" class="ks-nb2d-oculto" accept=".mp3,.wav,.ogg"><label class="ks-btn ghost" for="nb2d-snd-idle">Choose</label><span id="nb2d-snd-idle-nombre" class="ks-nb2d-archivo"></span><button type="button" id="nb2d-snd-idle-quitar" class="ks-nb2d-x" hidden>Remove</button></div>
<div class="ks-nb2d-sonido"><span>On hit</span><input type="file" id="nb2d-snd-attack" class="ks-nb2d-oculto" accept=".mp3,.wav,.ogg"><label class="ks-btn ghost" for="nb2d-snd-attack">Choose</label><span id="nb2d-snd-attack-nombre" class="ks-nb2d-archivo"></span><button type="button" id="nb2d-snd-attack-quitar" class="ks-nb2d-x" hidden>Remove</button></div>
</section>
<section class="ks-nb2d-panel">
<h2 id="save">4. Save</h2>
<p class="ks-nb2d-botones"><button type="button" id="nb2d-guardar-zip" class="ks-btn">Download ZIP</button><button type="button" id="nb2d-guardar-carpeta" class="ks-btn ghost">Save to a folder</button></p>
<p class="ks-nb2d-ayuda">Download the ZIP and unzip it inside garrysmod/addons. It is usually in C:\Program Files (x86)\Steam\steamapps\common\GarrysMod\garrysmod\addons.</p>
<p id="nb2d-ayuda-carpeta" class="ks-nb2d-ayuda">Save to a folder: Chrome and Edge do not let a web page write inside Program Files, where Steam installs Garry's Mod by default. This only works if your Garry's Mod is somewhere else, like a Steam library on another drive.</p>
<p id="nb2d-estado" class="ks-nb2d-estado" role="status" aria-live="polite"></p>
</section>
</div>
</div>
<script type="module" src="__NB2D_BASE__app.js?v=__NB2D_V__"></script>

## Share it on the Workshop

This page cannot publish for you: publishing needs Steam running on your computer. Use the tools that come with Garry's Mod (gmad and gmpublish, in the GarrysMod/bin folder) or gmpublisher. The README file inside the addon has the commands.
