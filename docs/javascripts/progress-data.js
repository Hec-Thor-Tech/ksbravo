/* =====================================================================
   PROGRESO DE LOS PACKS — el UNICO archivo que se toca para actualizar.
   Cambias "steps" del personaje, subis "updated", y corres
   ActualizarPaginaOficial.bat. Nada mas.

   steps = pasos completados de la checklist de produccion (0 a total).
   El total es 31: files/downloads, modelado (10), animaciones (12),
   QC/LUA/sonidos/foto/ingame/final (9)... el mismo orden de la hoja.
   Un pack terminado se puede dejar un tiempo como "Done" y despues
   borrarlo de la lista (o moverlo abajo de todo).
   ===================================================================== */
window.KS_PROGRESS = {
  updated: "2026-08-19",
  packs: [
    {
      name: "3D Memes Bonus Pack 01",
      note: "Winners of the community poll on YouTube.",
      note_es: "Los ganadores de la encuesta de la comunidad en YouTube.",
      total: 31,
      models: [
        { name: "Pellow",    steps: 10 },
        { name: "Umnidorid", steps: 2 },
        { name: "Tim",       steps: 2 },
        { name: "Megmen",    steps: 2 },
        { name: "NubStir",   steps: 2 },
        { name: "Nyoan Cot", steps: 2 }
      ]
    }
  ]
};
