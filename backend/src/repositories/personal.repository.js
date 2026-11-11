
//Este repositorio responde ¿esta persona trabaja en una clínica activa, con qué rol, y si es veterinario, cuáles son sus datos?

// Todo lo del PERSONAL de la clínica (recepcionista, veterinario, administrador)

import { pool } from "../config/db.js";

// Vínculo ACTIVO de un usuario con su clínica: personal_clinica en 301 y clínica en 201.
// Trae también su rol del portal CLINICA y, si es veterinario, su perfil_veterinario.
export async function buscarVinculo(usuarioId) {
  const [filas] = await pool.query(
    `SELECT pc.id AS personalId, pc.fecha_ingreso AS fechaIngreso,
            c.id AS clinicaId, c.nombre_comercial AS nombreComercial, c.direccion, c.logo_url AS logoUrl,
            r.codigo AS rol, r.nombre AS rolNombre,
            pv.numero_licencia AS licencia, esp.nombre AS especialidad, pv.presentacion
       FROM personal_clinica pc
       JOIN clinicas c        ON c.id = pc.clinica_id AND c.estado_id = 201
       JOIN usuario_roles ur  ON ur.usuario_id = pc.usuario_id
       JOIN roles r           ON r.id = ur.rol_id AND r.portal = 'CLINICA'
       LEFT JOIN perfil_veterinario pv ON pv.usuario_id = pc.usuario_id
       LEFT JOIN especialidades esp    ON esp.id = pv.especialidad_id
      WHERE pc.usuario_id = ? AND pc.estado_id = 301
      LIMIT 1`,
    [usuarioId]
  );
  return filas[0] ?? null;
}

// Horario semanal del veterinario (horarios_personal), ordenado de lunes a domingo
export async function horariosDe(personalId) {
  const [filas] = await pool.query(
    `SELECT dia_semana AS dia,
            TIME_FORMAT(hora_inicio, '%H:%i') AS inicio,
            TIME_FORMAT(hora_fin, '%H:%i') AS fin
       FROM horarios_personal
      WHERE personal_id = ?
      ORDER BY FIELD(dia_semana, 'LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO','DOMINGO'), hora_inicio`,
    [personalId]
  );
  return filas;
}