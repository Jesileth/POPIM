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
      WHERE ex.mascota_id = ? AND c.fecha_cierre IS NOT NULL
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

// Una consulta FINALIZADA de una mascota de este propietario.
// Si no es suya o el veterinario no la ha cerrado, devuelve null.
export async function buscarConsulta(consultaId, propietarioId) {
  const [filas] = await pool.query(
    `SELECT c.id, c.fecha_inicio AS fechaInicio,
            c.peso_kg AS pesoKg, c.temperatura_c AS temperaturaC,
            c.frecuencia_cardiaca AS frecuenciaCardiaca,
            c.observaciones_generales AS observacionesGenerales,
            ci.es_emergencia AS esEmergencia, ci.prioridad, ci.motivo_consulta AS motivoConsulta,
            m.id AS mascotaId, m.nombre AS mascotaNombre,
            u.nombre_completo AS vetNombre, esp.nombre AS vetEspecialidad,
            cl.nombre_comercial AS clinicaNombre
       FROM consultas c
       JOIN expedientes_clinicos ex ON ex.id = c.expediente_id
       JOIN mascotas m ON m.id = ex.mascota_id
       LEFT JOIN citas ci ON ci.id = c.cita_id
       LEFT JOIN personal_clinica pc ON pc.id = c.personal_id
       LEFT JOIN usuarios u ON u.id = pc.usuario_id
       LEFT JOIN perfil_veterinario pv ON pv.usuario_id = pc.usuario_id
       LEFT JOIN especialidades esp ON esp.id = pv.especialidad_id
       LEFT JOIN clinicas cl ON cl.id = pc.clinica_id
      WHERE c.id = ? AND m.propietario_id = ? AND c.fecha_cierre IS NOT NULL`,
    [consultaId, propietarioId]
  );
  return filas[0] ?? null;
}

// Todo lo que cuelga de la consulta. Son 7 consultas pequeñas, lanzadas al mismo tiempo
// con Promise.all: como cada viaje a Aiven tarda ~200 ms, juntas tardan casi lo mismo que una.
export async function detalleConsulta(consultaId) {
  const [[hallazgos], [diagnosticos], [tratamientos], [recetas], [items], [examenes], [dosis]] =
    await Promise.all([
      pool.query(
        "SELECT id, descripcion FROM hallazgos_consulta WHERE consulta_id = ? ORDER BY fecha",
        [consultaId]
      ),
      pool.query(
        `SELECT d.id, d.descripcion, p.nombre AS padecimientoNombre, p.codigo AS padecimientoCodigo,
                cp.nombre AS clasificacion
           FROM diagnosticos d
           JOIN padecimientos p ON p.id = d.padecimiento_id
           JOIN clasificaciones_padecimiento cp ON cp.id = p.clasificacion_id
          WHERE d.consulta_id = ?
          ORDER BY d.fecha`,
        [consultaId]
      ),
      pool.query(
        `SELECT id, descripcion, fecha_inicio AS fechaInicio, duracion_dias AS duracionDias, indicaciones
           FROM tratamientos WHERE consulta_id = ?`,
        [consultaId]
      ),
      pool.query("SELECT id, fecha, observaciones FROM recetas WHERE consulta_id = ?", [consultaId]),
      pool.query(
        `SELECT ri.id, me.nombre AS medicamentoNombre, me.presentacion AS medicamentoPresentacion,
                ri.dosis, ri.frecuencia, ri.duracion_dias AS duracionDias
           FROM receta_items ri
           JOIN recetas r ON r.id = ri.receta_id
           JOIN medicamentos me ON me.id = ri.medicamento_id
          WHERE r.consulta_id = ?
          ORDER BY ri.id`,
        [consultaId]
      ),
      pool.query(
        `SELECT re.id, ex.mascota_id AS mascotaId, re.consulta_id AS consultaId,
                te.id AS tipoId, te.nombre AS tipoNombre,
                re.nombre_original AS nombreOriginal, re.mime_type AS mimeType,
                re.tamano_bytes AS tamanoBytes, re.fecha_carga AS fechaCarga
           FROM resultados_examen re
           JOIN expedientes_clinicos ex ON ex.id = re.expediente_id
           JOIN tipos_examen te ON te.id = re.tipo_examen_id
          WHERE re.consulta_id = ?
          ORDER BY re.fecha_carga`,
        [consultaId]
      ),
      pool.query(
        `SELECT d.id, p.nombre AS productoNombre, d.fecha_aplicada AS fechaAplicada, d.lote
           FROM dosis_preventivas d
           JOIN productos_preventivos p ON p.id = d.producto_id
          WHERE d.consulta_id = ? AND d.fecha_aplicada IS NOT NULL
          ORDER BY p.nombre`,
        [consultaId]
      ),
    ]);
  return { hallazgos, diagnosticos, tratamientos, recetas, items, examenes, dosis };
}