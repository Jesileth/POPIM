
//prueba@ejemplo.com

import { enviarCorreo } from "../src/services/correo.service.js";

const resultado = await enviarCorreo({
  para: "clarisamyjob@gmail.com",
  asunto: "Prueba POPIM",
  texto: "Hola desde POPIM",
  html: "<p>Hola desde <b>POPIM</b></p>",
});
console.log(resultado);