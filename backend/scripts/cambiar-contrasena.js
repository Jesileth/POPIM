//

// Pone una contraseña nueva a una cuenta (herramienta de administrador para pruebas).
// Uso, desde la carpeta backend:
//   node --env-file=.env scripts/cambiar-contrasena.js correo@ejemplo.com NuevaClave123

import bcrypt from "bcryptjs";
import { pool } from "../src/config/db.js";

// process.argv trae lo que escribiste en la terminal: [node, script, correo, contraseña]
const [correo, contrasena] = process.argv.slice(2);

try {
  if (!correo || !contrasena) throw new Error("Escribe el correo y la contraseña nueva.");
  if (contrasena.length < 8 || contrasena.length > 72) throw new Error("La contraseña debe tener entre 8 y 72 caracteres.");

  const hash = await bcrypt.hash(contrasena, 12);

  // También reinicia los intentos fallidos y, si estaba BLOQUEADA (103), la reactiva (102).
  // Solo toca cuentas que ya tienen contraseña (las pendientes 101 se activan con su código).
  const [resultado] = await pool.query(
    `UPDATE usuarios
        SET contrasena = ?, intentos_fallidos = 0,
            estado_id = IF(estado_id = 103, 102, estado_id)
      WHERE correo = ? AND contrasena IS NOT NULL`,
    [hash, correo.toLowerCase()]
  );

  if (resultado.affectedRows === 0) throw new Error(`No hay una cuenta con contraseña para ${correo}.`);
  console.log(`Listo: ${correo} ahora entra con "${contrasena}"`);
} catch (error) {
  console.error("No se cambió la contraseña:", error.message);
} finally {
  await pool.end();
}