
//
// Crea el PRIMER Super Administrador de POPIM, ya ACTIVO (102).
// No tiene fila en personal_clinica: administra toda la red, no una clínica.
// Se ejecuta UNA vez, desde la carpeta backend:
//   pnpm crear-super-admin

import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { pool } from "../src/config/db.js";

// ⚠ Cambia estos datos antes de ejecutar
const NOMBRE = "Administradora POPIM";
const CORREO = "superadmin@prueba.popim";
const CONTRASENA = "Prueba123";

const conexion = await pool.getConnection();
try {
  await conexion.beginTransaction();

  const [[existe]] = await conexion.query("SELECT id FROM usuarios WHERE correo = ?", [CORREO]);
  if (existe) throw new Error(`Ya existe un usuario con el correo ${CORREO}: no se creó nada.`);

  const usuarioId = crypto.randomUUID();
  const hash = await bcrypt.hash(CONTRASENA, 12);

  // 1) La persona (activa: tiene contraseña y correo, así cumple chk_usuario_activo)
  await conexion.query(
    "INSERT INTO usuarios (id, nombre_completo, correo, contrasena, estado_id) VALUES (?, ?, ?, ?, 102)",
    [usuarioId, NOMBRE, CORREO.toLowerCase(), hash]
  );

  // 2) Su rol. Si el rol no existe, affectedRows = 0 y deshacemos todo
  const [rol] = await conexion.query(
    "INSERT INTO usuario_roles (usuario_id, rol_id) SELECT ?, id FROM roles WHERE codigo = 'SUPER_ADMIN'",
    [usuarioId]
  );
  if (rol.affectedRows !== 1) throw new Error("No existe el rol SUPER_ADMIN en la tabla roles");

  await conexion.commit();
  console.log(`Listo: ${CORREO} / ${CONTRASENA} (Super Administrador)`);
} catch (error) {
  await conexion.rollback();
  console.error("No se creó el Super Administrador:", error.message);
} finally {
  conexion.release();
  await pool.end(); // cierra las conexiones para que el script termine
}