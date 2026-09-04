/* =====================================================================
   PROGRESO DE LOS PACKS

   ESTE ARCHIVO LO ESCRIBE EL PROGRAMA "Gestor Web KSBravo".
   No lo edites a mano: la proxima vez que guardes desde el programa se
   vuelve a generar y perdes el cambio. Todo se toca desde el programa,
   pestana "Trabajo en Progreso", y despues el boton Publicar.

   steps = pasos completados de la checklist de produccion (0 al total).
   El total por defecto es 31: files/downloads, modelado (10),
   animaciones (12), QC/LUA/sonidos/foto/ingame/final (9); el mismo orden
   de la hoja de Google.
   ===================================================================== */

window.KS_PROGRESS = {
  updated: "2026-09-04",
  packs: [
    {
      name: "3D Memes Bonus Pack 01",
      note: "Winners of the community poll on YouTube.",
      note_es: "Los ganadores de la encuesta de la comunidad en YouTube.",
      total: 30,
      // img = la referencia 2D del personaje, en docs/img/
      models: [
        { name: "Pellow",    steps: 20, img: "ref-pellow.webp", imgv: "1787199448" },
        { name: "Umnidorid", steps: 30, img: "ref-umnidorid.webp", imgv: "1787253870", video: "a6VqXX8Njzk" },
        { name: "Tim",       steps: 11, img: "ref-tim.webp", imgv: "1787199448" },
        { name: "Megmen",    steps: 10, img: "ref-megmen.webp", imgv: "1787199449" },
        { name: "Noobstar",  steps: 11, img: "ref-noobstar.webp", imgv: "1787199450" },
        { name: "Nyoan Cot", steps: 15, img: "ref-nyoancot.webp", imgv: "1787199451" }
      ]
    },
    {
      name: "3D Memes Pack 22",
      note: "The next pack in the 3D Memes line for Garry's Mod.",
      note_es: "El proximo pack de la linea 3D Memes para Garry's Mod.",
      total: 30,
      // img = la referencia 2D del personaje, en docs/img/
      models: [
        { name: "Tutweno Bonduy",   steps:  6, img: "ref-tutwenobonduy.webp", imgv: "1788108346" },
        { name: "Whyti",            steps: 20, img: "ref-whyti.webp", imgv: "1788108347" },
        { name: "Criim Teh Ribbit", steps:  6, img: "ref-criimtehribbit.webp", imgv: "1788108348" },
        { name: "Ezzyne",           steps:  5, img: "ref-ezzyne.webp", imgv: "1788108349" },
        { name: "Pellow V2",        steps: 20, img: "ref-pellowv2.webp", imgv: "1788108350" },
        { name: "Desploy",          steps:  6, img: "ref-desploy.webp", imgv: "1788108351" }
      ]
    },
    {
      name: "Jeff The Killer",
      note: "An advanced character with many new features. Developed by Joelias_N1.",
      note_es: "Un personaje muy avanzado, con muchas caracteristicas nuevas. Desarrollado por Joelias_N1.",
      total: 30,
      // img = la referencia 2D del personaje, en docs/img/
      models: [
        { name: "Jeff", steps: 15, img: "ref-jeff.webp", imgv: "1788107303" }
      ]
    }
  ]
};
