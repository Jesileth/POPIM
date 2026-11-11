import { pool } from "../src/config/db.js";
import * as verificacion from "../src/services/verificacion.service.js";

const [[usuario]] = await pool.query("SELECT id FROM usuarios LIMIT 1");

const { codigo } = await verificacion.emitirCodigo(usuario.id, "RECUPERACION");
console.log("Código emitido:", codigo);

try {
  await verificacion.validarCodigo(usuario.id, "RECUPERACION", "000000");
} catch (error) {
  console.log("Código malo ->", error.message);
}

const token = await verificacion.validarCodigo(usuario.id, "RECUPERACION", codigo);
console.log("Código bueno -> válido");

await verificacion.consumirCodigo(token.id);
try {
  await verificacion.validarCodigo(usuario.id, "RECUPERACION", codigo);
} catch (error) {
  console.log("Reusar el código ->", error.message);
}

await pool.end();