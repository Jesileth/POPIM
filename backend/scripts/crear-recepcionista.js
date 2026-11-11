//

// Crea una recepcionista de prueba ya ACTIVA (102) en "POPIM Central - Managua".
// Se ejecuta UNA vez, desde la carpeta backend:
//   node --env-file=.env scripts/crear-recepcionista.js

import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { pool } from "../src/config/db.js";

const NOMBRE = "Rosa Calero";
const CORREO = "recepcion@prueba.popim";
const CONTRASENA = "Prueba123";
const CLINICA = "POPIM Central - Managua";

const conexion = await pool.getConnection();
try {
  await conexion.beginTransaction();

  const [[clinica]] = await conexion.query("SELECT id FROM clinicas WHERE nombre_comercial = ?", [CLINICA]);
  if (!clinica) throw new Error(`No existe la clínica "${CLINICA}"`);

  const [[existe]] = await conexion.query("SELECT id FROM usuarios WHERE correo = ?", [CORREO]);
  if (existe) throw new Error(`Ya existe un usuario con el correo ${CORREO}: no se creó nada.`);

  const usuarioId = crypto.randomUUID();
  const hash = await bcrypt.hash(CONTRASENA, 12);

  // 1) La persona (cuenta activa: tiene contraseña, así cumple chk_usuario_activo)
  await conexion.query(
    "INSERT INTO usuarios (id, nombre_completo, correo, contrasena, estado_id) VALUES (?, ?, ?, ?, 102)",
    [usuarioId, NOMBRE, CORREO, hash]
  );
  // 2) Su rol
  await conexion.query(
    "INSERT INTO usuario_roles (usuario_id, rol_id) SELECT ?, id FROM roles WHERE codigo = 'RECEPCIONISTA'",
    [usuarioId]
  );
  // 3) Su vínculo con la clínica (estado 301 = activo, por defecto)
  await conexion.query(
    "INSERT INTO personal_clinica (id, usuario_id, clinica_id) VALUES (?, ?, ?)",
    [crypto.randomUUID(), usuarioId, clinica.id]
  );

  await conexion.commit();
  console.log(`Listo: ${CORREO} / ${CONTRASENA} (recepcionista de ${CLINICA})`);
} catch (error) {
  await conexion.rollback();
  console.error("No se creó la recepcionista:", error.message);
} finally {
  conexion.release();
  await pool.end(); // cierra las conexiones para que el script termine
}