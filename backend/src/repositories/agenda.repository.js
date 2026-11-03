
// Todo sobre los horarios de los veterinarios, clinicas etc

import { pool } from "../config/db.js";

export async function listarClinicas() {
  const [filas] = await pool.query(
    `SELECT id, nombre_comercial AS nombreComercial, direccion,
            duracion_cita_min AS duracionCitaMin
       FROM clinicas
      WHERE estado_id = 201
      ORDER BY nombre_comercial`
  );
  return filas;
}

export async function listarVeterinarios(clinicaId) {
  const [filas] = await pool.query(
    `SELECT pc.id, pc.clinica_id AS clinicaId, u.nombre_completo AS nombreCompleto,
            esp.nombre AS especialidad, pv.presentacion
       FROM personal_clinica pc
       JOIN usuarios u ON u.id = pc.usuario_id
       JOIN perfil_veterinario pv ON pv.usuario_id = pc.usuario_id
       LEFT JOIN especialidades esp ON esp.id = pv.especialidad_id
      WHERE pc.clinica_id = ? AND pc.estado_id = 301 AND u.estado_id NOT IN (103, 104)
      ORDER BY u.nombre_completo`,
    [clinicaId]
  );
  return filas;
}

// Trae todo lo necesario para calcular los bloques, en paralelo (un solo viaje de espera)
export async function datosDeAgenda(veterinarioId, fecha, diaSemana) {
  const [[vet], [horarios], [citas], [bloqueos]] = await Promise.all([
    pool.query(
      `SELECT pc.id, cl.duracion_cita_min AS duracion
         FROM personal_clinica pc JOIN clinicas cl ON cl.id = pc.clinica_id
        WHERE pc.id = ? AND pc.estado_id = 301 AND cl.estado_id = 201`,
      [veterinarioId]
    ),
    pool.query(
      `SELECT hora_inicio AS horaInicio, hora_fin AS horaFin
         FROM horarios_personal
        WHERE personal_id = ? AND dia_semana = ?
        ORDER BY hora_inicio`,
      [veterinarioId, diaSemana]
    ),
    pool.query(
      `SELECT hora_inicio AS horaInicio, hora_fin AS horaFin
         FROM citas
        WHERE veterinario_id = ? AND fecha = ? AND estado_id <> 505`,
      [veterinarioId, fecha]
    ),
    pool.query(
      `SELECT inicio, fin FROM bloqueos_agenda
        WHERE personal_id = ? AND inicio < ? AND fin > ?`,
      [veterinarioId, `${fecha} 23:59:59`, `${fecha} 00:00:00`]
    ),
  ]);
  return { vet: vet[0] ?? null, horarios, citas, bloqueos };
}