
// Personal de UNA clínica (lo usa su Administrador). Aquí solo hay SQL.
// Todas las consultas reciben el clinicaId de la sesión (req.personal.clinicaId),
// nunca uno que mande el navegador.

import crypto from "node:crypto";
import { pool } from "../config/db.js";

// Columnas de una persona del personal (se usan en la lista y al buscar una sola)
const COLUMNAS = `pc.id AS personalId, pc.estado_id AS vinculoEstadoId, pc.fecha_ingreso AS fechaIngreso,
       u.id AS usuarioId, u.nombre_completo AS nombreCompleto, u.correo, u.telefono,
       u.estado_id AS cuentaEstadoId, u.intentos_fallidos AS intentosFallidos, u.ultimo_acceso AS ultimoAcceso,
       (SELECT r.codigo FROM usuario_roles ur JOIN roles r ON r.id = ur.rol_id AND r.portal = 'CLINICA'
         WHERE ur.usuario_id = u.id LIMIT 1) AS rol,
       pv.numero_licencia AS licencia, pv.especialidad_id AS especialidadId, esp.nombre AS especialidad`;

const DESDE = `FROM personal_clinica pc
       JOIN usuarios u                 ON u.id = pc.usuario_id
       LEFT JOIN perfil_veterinario pv ON pv.usuario_id = u.id
       LEFT JOIN especialidades esp    ON esp.id = pv.especialidad_id`;

// Todo el personal de la clínica (activos primero), con vínculo activo o inactivo
export async function listar(clinicaId) {
  const [filas] = await pool.query(
    `SELECT ${COLUMNAS} ${DESDE}
      WHERE pc.clinica_id = ?
      ORDER BY pc.estado_id, u.nombre_completo`,
    [clinicaId]
  );
  return filas;
}

// Una persona, pero SOLO si pertenece a esta clínica (si no, devuelve null → 404)
export async function buscarEnClinica(personalId, clinicaId) {
  const [filas] = await pool.query(
    `SELECT ${COLUMNAS} ${DESDE} WHERE pc.id = ? AND pc.clinica_id = ?`,
    [personalId, clinicaId]
  );
  return filas[0] ?? null;
}

export async function especialidades() {
  const [filas] = await pool.query("SELECT id, nombre FROM especialidades ORDER BY nombre");
  return filas;
}

// ---------- Para vincular por correo ----------

export async function cuentaPorCorreo(correo) {
  const [filas] = await pool.query(
    `SELECT u.id, u.nombre_completo AS nombreCompleto, u.telefono, u.estado_id AS estadoId,
            pv.numero_licencia AS licencia
       FROM usuarios u
       LEFT JOIN perfil_veterinario pv ON pv.usuario_id = u.id
      WHERE u.correo = ?`,
    [correo]
  );
  return filas[0] ?? null;
}

// Rol que la persona ya tiene en el portal de la clínica (o null)
export async function rolClinicaDe(usuarioId) {
  const [filas] = await pool.query(
    `SELECT r.codigo FROM usuario_roles ur JOIN roles r ON r.id = ur.rol_id AND r.portal = 'CLINICA'
      WHERE ur.usuario_id = ? LIMIT 1`,
    [usuarioId]
  );
  return filas[0]?.codigo ?? null;
}

// Todos sus vínculos (activos e inactivos) con el nombre de cada clínica
export async function vinculosDe(usuarioId) {
  const [filas] = await pool.query(
    `SELECT pc.clinica_id AS clinicaId, c.nombre_comercial AS clinica, pc.estado_id AS estadoId
       FROM personal_clinica pc JOIN clinicas c ON c.id = pc.clinica_id
      WHERE pc.usuario_id = ?`,
    [usuarioId]
  );
  return filas;
}

// Crea (si hace falta) la cuenta, le da el rol, el perfil de veterinario y el vínculo. Todo o nada.
// Devuelve el personal_clinica.id (para ir directo a asignarle horario).
export async function vincular({ clinicaId, existenteId, persona, rol, veterinario, creadoPor }) {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();

    // 1) La cuenta: si es nueva nace PENDIENTE (101) y sin contraseña ("Activar mi cuenta")
    let usuarioId = existenteId;
    if (!usuarioId) {
      usuarioId = crypto.randomUUID();
      await conexion.query(
        `INSERT INTO usuarios (id, nombre_completo, correo, telefono, estado_id, creado_por_usuario_id)
         VALUES (?, ?, ?, ?, 101, ?)`,
        [usuarioId, persona.nombreCompleto, persona.correo, persona.telefono, creadoPor]
      );
    }

    // 2) El rol (IGNORE: si ya lo tenía, no se repite)
    await conexion.query(
      "INSERT IGNORE INTO usuario_roles (usuario_id, rol_id) SELECT ?, id FROM roles WHERE codigo = ?",
      [usuarioId, rol]
    );

    // 3) Solo veterinarios y solo si aún no tienen perfil: licencia, especialidad y presentación
    if (veterinario) {
      await conexion.query(
        `INSERT INTO perfil_veterinario (usuario_id, numero_licencia, especialidad_id, presentacion)
         VALUES (?, ?, ?, ?)`,
        [usuarioId, veterinario.licencia, veterinario.especialidadId, veterinario.presentacion]
      );
    }

    // 4) El vínculo. Si ya estuvo en esta clínica (vínculo inactivo), uq_personal no deja
    //    otra fila: ON DUPLICATE KEY UPDATE reactiva la que ya existe.
    await conexion.query(
      `INSERT INTO personal_clinica (id, usuario_id, clinica_id) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE estado_id = 301`,
      [crypto.randomUUID(), usuarioId, clinicaId]
    );
    const [[vinculo]] = await conexion.query(
      "SELECT id FROM personal_clinica WHERE usuario_id = ? AND clinica_id = ?",
      [usuarioId, clinicaId]
    );

    await conexion.commit();
    return vinculo.id;
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}

// ---------- Acciones sobre una persona ----------

export async function tienePerfilVeterinario(usuarioId) {
  const [filas] = await pool.query("SELECT 1 FROM perfil_veterinario WHERE usuario_id = ?", [usuarioId]);
  return filas.length > 0;
}

export async function actualizarProfesional(usuarioId, { licencia, especialidadId }) {
  await pool.query(
    "UPDATE perfil_veterinario SET numero_licencia = ?, especialidad_id = ? WHERE usuario_id = ?",
    [licencia, especialidadId, usuarioId]
  );
}

export async function crearPerfilVeterinario(usuarioId, { licencia, especialidadId }) {
  await pool.query(
    "INSERT INTO perfil_veterinario (usuario_id, numero_licencia, especialidad_id) VALUES (?, ?, ?)",
    [usuarioId, licencia, especialidadId]
  );
}

// Solo si de verdad está bloqueada (103)
export async function desbloquear(usuarioId) {
  const [resultado] = await pool.query(
    "UPDATE usuarios SET estado_id = 102, intentos_fallidos = 0 WHERE id = ? AND estado_id = 103",
    [usuarioId]
  );
  return resultado.affectedRows === 1;
}

export async function cambiarVinculo(personalId, estadoId) {
  await pool.query("UPDATE personal_clinica SET estado_id = ? WHERE id = ?", [estadoId, personalId]);
}

// Citas que todavía tiene por atender (solicitadas o confirmadas, de hoy en adelante)
export async function citasPendientesDe(personalId) {
  const [filas] = await pool.query(
    `SELECT COUNT(*) AS total FROM citas
      WHERE veterinario_id = ? AND fecha >= CURDATE() AND estado_id IN (501, 502)`,
    [personalId]
  );
  return Number(filas[0].total);
}