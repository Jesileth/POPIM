

// "Mi clínica" del Administrador. Aquí solo hay SQL.
// Para LEER la clínica y su horario se reutilizan buscar() y horariosDe() de superClinicas.repository.

import { pool } from "../config/db.js";

// Cuántos veterinarios activos tiene (para la vista previa que ve el propietario)
export async function veterinariosActivos(clinicaId) {
  const [[fila]] = await pool.query(
    `SELECT COUNT(*) AS total
       FROM personal_clinica pc
       JOIN usuario_roles ur ON ur.usuario_id = pc.usuario_id
       JOIN roles r          ON r.id = ur.rol_id AND r.codigo = 'VETERINARIO'
      WHERE pc.clinica_id = ? AND pc.estado_id = 301`,
    [clinicaId]
  );
  return Number(fila.total);
}

// Solo contacto y duración de la cita: lo demás lo administra POPIM
export async function actualizar(clinicaId, { telefono, correo, duracionCitaMin }) {
  await pool.query(
    "UPDATE clinicas SET telefono = ?, correo = ?, duracion_cita_min = ? WHERE id = ?",
    [telefono, correo, duracionCitaMin, clinicaId]
  );
}

export async function logoDe(clinicaId) {
  const [[fila]] = await pool.query("SELECT logo_url AS logoUrl FROM clinicas WHERE id = ?", [clinicaId]);
  return fila?.logoUrl ?? null;
}

export async function cambiarLogo(clinicaId, url) {
  await pool.query("UPDATE clinicas SET logo_url = ? WHERE id = ?", [url, clinicaId]);
}