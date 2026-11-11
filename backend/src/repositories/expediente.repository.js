//

import { pool } from "../config/db.js";

export async function listarDosis(mascotaId) {
  const [filas] = await pool.query(
    `SELECT d.id, p.id AS productoId, p.tipo AS productoTipo, p.nombre AS productoNombre,
            d.fecha_programada AS fechaProgramada, d.fecha_aplicada AS fechaAplicada,
            ce.id AS estadoId, ce.codigo AS estadoCodigo, ce.nombre AS estadoNombre,
            d.lote, d.observaciones,
            u.nombre_completo AS aplicadaPor, pc.clinica_id AS clinicaId
       FROM dosis_preventivas d
       JOIN cartillas c ON c.id = d.cartilla_id
       JOIN productos_preventivos p ON p.id = d.producto_id
       JOIN catalogo_estados ce ON ce.id = d.estado_id AND ce.entidad = 'DOSIS'
       LEFT JOIN personal_clinica pc ON pc.id = d.aplicada_por_personal_id
       LEFT JOIN usuarios u ON u.id = pc.usuario_id
      WHERE c.mascota_id = ?
      ORDER BY d.fecha_programada`,
    [mascotaId]
  );
  return filas;
}

export async function listarConsultas(mascotaId) {
  const [filas] = await pool.query(
    `SELECT c.id, c.fecha_inicio AS fechaInicio, ci.es_emergencia AS esEmergencia, ci.prioridad,
            ci.motivo_consulta AS motivo,
            u.nombre_completo AS vetNombre, esp.nombre AS vetEspecialidad,
            (SELECT COUNT(*) FROM diagnosticos d WHERE d.consulta_id = c.id) AS totalDiagnosticos,
            EXISTS(SELECT 1 FROM recetas r WHERE r.consulta_id = c.id) AS tieneReceta,
            (SELECT COUNT(*) FROM resultados_examen re WHERE re.consulta_id = c.id) AS totalExamenes
       FROM consultas c
       JOIN expedientes_clinicos ex ON ex.id = c.expediente_id
       LEFT JOIN citas ci ON ci.id = c.cita_id
       LEFT JOIN personal_clinica pc ON pc.id = c.personal_id
       LEFT JOIN usuarios u ON u.id = pc.usuario_id
       LEFT JOIN perfil_veterinario pv ON pv.usuario_id = pc.usuario_id
       LEFT JOIN especialidades esp ON esp.id = pv.especialidad_id
      WHERE ex.mascota_id = ?
      ORDER BY c.fecha_inicio DESC`,
    [mascotaId]
  );
  return filas;
}

export async function listarExamenes(mascotaId) {
  const [filas] = await pool.query(
    `SELECT re.id, ex.mascota_id AS mascotaId, re.consulta_id AS consultaId,
            te.id AS tipoId, te.nombre AS tipoNombre,
            re.nombre_original AS nombreOriginal, re.mime_type AS mimeType,
            re.tamano_bytes AS tamanoBytes, re.fecha_carga AS fechaCarga
       FROM resultados_examen re
       JOIN expedientes_clinicos ex ON ex.id = re.expediente_id
       JOIN tipos_examen te ON te.id = re.tipo_examen_id
      WHERE ex.mascota_id = ?
      ORDER BY re.fecha_carga DESC`,
    [mascotaId]
  );
  return filas;
}