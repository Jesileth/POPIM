//

import { writeFileSync, mkdirSync } from "node:fs";
import { plantillaRecuperacion } from "../src/plantillas/recuperacion.js";

const { asunto, html, texto } = plantillaRecuperacion({ nombre: "Ana <b>Pérez</b>", codigo: "482917" });

mkdirSync("scripts/salida", { recursive: true });
writeFileSync("scripts/salida/recuperacion.html", html);

console.log("Asunto:", asunto);
console.log(texto);