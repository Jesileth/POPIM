

// SQL del rol VETERINARIO: su agenda, atención de hoy, consultas, pacientes y expediente.

import crypto from "node:crypto";
import { pool } from "../config/db.js";

// ---------- Pedacitos de SQL que se repiten (siempre sobre la consulta "co") ----------

// "Otitis externa, Dermatitis atópica"
const SQL_DIAGNOSTICO = `(SELECT GROUP_CONCAT(pa.nombre ORDER BY d.fecha SEPARATOR ', ')
    FROM diagnosticos d JOIN padecimientos pa ON pa.id = d.padecimiento_id
   WHERE d.consulta_id = co.id)`;

// Cita de control que agendó el mismo veterinario desde esta consulta → "2026-11-20 09:00"
const SQL_CONTROL = `(SELECT CONCAT(cc.fecha, ' ', TIME_FORMAT(cc.hora_inicio, '%H:%i'))
    FROM citas cc
   WHERE cc.referida_desde_consulta_id = co.id AND cc.veterinario_id = co.personal_id AND cc.estado_id <> 505
   ORDER BY cc.fecha LIMIT 1)`;

// Colega al que se refirió desde esta consulta
const SQL_REFERIDO = `(SELECT ur.nombre_completo
    FROM citas cr
    JOIN personal_clinica pr ON pr.id = cr.veterinario_id
    JOIN usuarios ur         ON ur.id = pr.usuario_id
   WHERE cr.referida_desde_consulta_id = co.id AND cr.veterinario_id <> co.personal_id AND cr.estado_id <> 505
   LIMIT 1)`;

// ---------- Mi agenda y Atención de hoy ----------

// Citas del veterinario entre dos fechas (sin canceladas ni ausentes), con su consulta si ya la abrió
export async function citasDelVeterinario(personalId, desde, hasta) {
  const [filas] = await pool.query(
    `SELECT ci.id, ci.fecha, ci.hora_inicio AS horaInicio, ci.hora_fin AS horaFin, ci.estado_id AS estadoId,
            ci.es_emergencia AS esEmergencia, ci.prioridad, ci.persona_presentador AS personaPresentador,
            ci.motivo_consulta AS motivo, ci.fecha_creacion AS fechaCreacion,
            m.id AS mascotaId, m.nombre AS mascotaNombre, m.codigo_unico AS mascotaCodigo,
            e.nombre AS especie, COALESCE(r.nombre, 'Mestizo') AS raza, m.edad_actual_meses AS edadMeses,
            p.id AS propietarioId, up.nombre_completo AS propietarioNombre, up.telefono AS propietarioTelefono,
            co.id AS consultaId, co.fecha_inicio AS consultaInicio, co.fecha_cierre AS consultaCierre,
            (co.peso_kg IS NOT NULL AND co.temperatura_c IS NOT NULL AND co.frecuencia_cardiaca IS NOT NULL) AS tieneSignos,
            ${SQL_DIAGNOSTICO} AS diagnostico,
            (SELECT COUNT(*) FROM recetas re JOIN receta_items ri ON ri.receta_id = re.id
              WHERE re.consulta_id = co.id) AS itemsReceta,
            ${SQL_CONTROL} AS control
       FROM citas ci
       JOIN v_mascotas m   ON m.id = ci.mascota_id
       JOIN especies e     ON e.id = m.especie_id
       LEFT JOIN razas r   ON r.id = m.raza_id
       JOIN propietarios p ON p.id = m.propietario_id
       JOIN usuarios up    ON up.id = p.usuario_id
       LEFT JOIN consultas co ON co.cita_id = ci.id
      WHERE ci.veterinario_id = ? AND ci.fecha BETWEEN ? AND ? AND ci.estado_id NOT IN (505, 506)
      ORDER BY ci.fecha, ci.hora_inicio`,
    [personalId, desde, hasta]
  );
  return filas;
}

export async function horarioSemanal(personalId) {
  const [filas] = await pool.query(
    `SELECT dia_semana AS dia, hora_inicio AS inicio, hora_fin AS fin
       FROM horarios_personal WHERE personal_id = ? ORDER BY hora_inicio`,
    [personalId]
  );
  return filas;
}

export async function bloqueosEnRango(personalId, desde, hasta) {
  const [filas] = await pool.query(
    `SELECT inicio, fin, motivo FROM bloqueos_agenda
      WHERE personal_id = ? AND inicio < ? AND fin > ?`,
    [personalId, `${hasta} 23:59:59`, `${desde} 00:00:00`]
  );
  return filas;
}

// ---------- Iniciar consulta ----------

export async function citaParaConsulta(citaId) {
  const [filas] = await pool.query(
    `SELECT ci.id, ci.veterinario_id AS veterinarioId, ci.fecha, ci.estado_id AS estadoId,
            ci.mascota_id AS mascotaId, ex.id AS expedienteId, co.id AS consultaId
       FROM citas ci
       LEFT JOIN expedientes_clinicos ex ON ex.mascota_id = ci.mascota_id
       LEFT JOIN consultas co            ON co.cita_id = ci.id
      WHERE ci.id = ?`,
    [citaId]
  );
  return filas[0] ?? null;
}

// Crea la consulta y pasa la cita de Confirmada (502) a En curso (503), con su historial.
// Devuelve null si la cita ya no estaba en 502 (alguien la cambió justo antes).
export async function abrirConsulta(cita, personalId, usuarioId) {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();

    // Mascotas viejas que no tengan expediente: se le crea uno aquí mismo
    let expedienteId = cita.expedienteId;
    if (!expedienteId) {
      expedienteId = crypto.randomUUID();
      await conexion.query(
        "INSERT INTO expedientes_clinicos (id, mascota_id, creado_por_usuario_id) VALUES (?, ?, ?)",
        [expedienteId, cita.mascotaId, usuarioId]
      );
    }

    const [cambio] = await conexion.query(
      "UPDATE citas SET estado_id = 503 WHERE id = ? AND estado_id = 502",
      [cita.id]
    );
    if (cambio.affectedRows === 0) {
      await conexion.rollback();
      return null;
    }

    const consultaId = crypto.randomUUID();
    await conexion.query(
      "INSERT INTO consultas (id, expediente_id, cita_id, personal_id) VALUES (?, ?, ?, ?)",
      [consultaId, expedienteId, cita.id, personalId]
    );
    await conexion.query(
      `INSERT INTO cita_historial_estados (cita_id, estado_anterior_id, estado_nuevo_id, cambiado_por_usuario_id, motivo)
       VALUES (?, 502, 503, ?, 'Inició la consulta')`,
      [cita.id, usuarioId]
    );

    await conexion.commit();
    return consultaId;
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}

// ---------- Mis consultas ----------

export async function consultasDelVeterinario(personalId) {
  const [filas] = await pool.query(
    `SELECT co.id, co.cita_id AS citaId, co.fecha_inicio AS inicio, co.fecha_cierre AS cierre,
            ci.es_emergencia AS esEmergencia, ci.prioridad, ci.motivo_consulta AS motivo,
            m.id AS mascotaId, m.nombre AS mascotaNombre, up.nombre_completo AS propietarioNombre,
            ${SQL_DIAGNOSTICO} AS diagnostico,
            (SELECT t.descripcion FROM tratamientos t WHERE t.consulta_id = co.id LIMIT 1) AS tratamiento,
            ${SQL_CONTROL} AS control,
            ${SQL_REFERIDO} AS referidoA
       FROM consultas co
       JOIN citas ci       ON ci.id = co.cita_id
       JOIN mascotas m     ON m.id = ci.mascota_id
       JOIN propietarios p ON p.id = m.propietario_id
       JOIN usuarios up    ON up.id = p.usuario_id
      WHERE co.personal_id = ?
      ORDER BY (co.fecha_cierre IS NULL) DESC, co.fecha_inicio DESC
      LIMIT 300`,
    [personalId]
  );
  return filas;
}

// ---------- Pacientes ----------

// Mascotas que tienen o tuvieron cita (o consulta) con este veterinario
export async function pacientesDelVeterinario(personalId) {
  const [filas] = await pool.query(
    `SELECT m.id, m.nombre, m.codigo_unico AS codigoUnico, e.nombre AS especie,
            up.nombre_completo AS propietarioNombre,
            (SELECT MAX(co.fecha_inicio) FROM consultas co
               JOIN expedientes_clinicos ex ON ex.id = co.expediente_id
              WHERE ex.mascota_id = m.id) AS ultimaVisita
       FROM mascotas m
       JOIN especies e     ON e.id = m.especie_id
       JOIN propietarios p ON p.id = m.propietario_id
       JOIN usuarios up    ON up.id = p.usuario_id
      WHERE m.id IN (
              SELECT ci.mascota_id FROM citas ci WHERE ci.veterinario_id = ? AND ci.estado_id <> 505
              UNION
              SELECT ex.mascota_id FROM consultas co
                JOIN expedientes_clinicos ex ON ex.id = co.expediente_id
               WHERE co.personal_id = ?)`,
    [personalId, personalId]
  );
  return filas;
}

// Cartilla de varias mascotas a la vez (para las alertas de la lista de pacientes)
export async function dosisDeMascotas(mascotaIds) {
  if (mascotaIds.length === 0) return [];
  const [filas] = await pool.query(
    `SELECT ca.mascota_id AS mascotaId, d.id, p.id AS productoId, p.nombre, p.tipo,
            d.fecha_programada AS fechaProgramada, d.fecha_aplicada AS fechaAplicada,
            d.estado_id AS estadoId, d.lote
       FROM dosis_preventivas d
       JOIN cartillas ca             ON ca.id = d.cartilla_id
       JOIN productos_preventivos p  ON p.id = d.producto_id
      WHERE ca.mascota_id IN (?)`,
    [mascotaIds]
  );
  return filas;
}

// ---------- Expediente ----------

export async function mascotaConExpediente(mascotaId) {
  const [filas] = await pool.query(
    `SELECT m.id, m.nombre, m.codigo_unico AS codigoUnico, m.sexo, m.edad_actual_meses AS edadMeses,
            e.nombre AS especie, COALESCE(r.nombre, 'Mestizo') AS raza,
            up.nombre_completo AS propietarioNombre, up.telefono AS propietarioTelefono,
            ex.id AS expedienteId
       FROM v_mascotas m
       JOIN especies e     ON e.id = m.especie_id
       LEFT JOIN razas r   ON r.id = m.raza_id
       JOIN propietarios p ON p.id = m.propietario_id
       JOIN usuarios up    ON up.id = p.usuario_id
       LEFT JOIN expedientes_clinicos ex ON ex.mascota_id = m.id
      WHERE m.id = ?`,
    [mascotaId]
  );
  return filas[0] ?? null;
}

// Columnas de una consulta que usan el expediente y la pantalla de consulta
const SELECT_CONSULTA = `
  SELECT co.id, co.expediente_id AS expedienteId, co.fecha_inicio AS inicio, co.fecha_cierre AS cierre,
         co.peso_kg AS pesoKg, co.temperatura_c AS temperatura, co.frecuencia_cardiaca AS frecuenciaCardiaca,
         co.observaciones_generales AS observaciones,
         ci.id AS citaId, ci.fecha, TIME_FORMAT(ci.hora_inicio, '%H:%i') AS horaCita,
         ci.motivo_consulta AS motivo, ci.es_emergencia AS esEmergencia, ci.prioridad, ci.mascota_id AS mascotaId,
         pc.id AS personalId, pc.clinica_id AS clinicaId, uv.nombre_completo AS veterinario,
         cl.nombre_comercial AS clinica,
         ${SQL_DIAGNOSTICO} AS diagnostico, ${SQL_CONTROL} AS control, ${SQL_REFERIDO} AS referidoA
    FROM consultas co
    JOIN expedientes_clinicos ex ON ex.id = co.expediente_id
    LEFT JOIN citas ci         ON ci.id = co.cita_id
    JOIN personal_clinica pc   ON pc.id = co.personal_id
    JOIN usuarios uv           ON uv.id = pc.usuario_id
    JOIN clinicas cl           ON cl.id = pc.clinica_id`;

export async function consultasDeMascota(mascotaId) {
  const [filas] = await pool.query(`${SELECT_CONSULTA} WHERE ex.mascota_id = ? ORDER BY co.fecha_inicio DESC`, [mascotaId]);
  return filas;
}

export async function buscarConsulta(consultaId) {
  const [filas] = await pool.query(`${SELECT_CONSULTA} WHERE co.id = ?`, [consultaId]);
  return filas[0] ?? null;
}

// Peso de la consulta anterior de la mascota (para mostrar "+0.3 kg")
export async function pesoAnterior(mascotaId, consultaId, antesDe) {
  const [filas] = await pool.query(
    `SELECT co.peso_kg AS pesoKg FROM consultas co
       JOIN expedientes_clinicos ex ON ex.id = co.expediente_id
      WHERE ex.mascota_id = ? AND co.id <> ? AND co.peso_kg IS NOT NULL AND co.fecha_inicio < ?
      ORDER BY co.fecha_inicio DESC LIMIT 1`,
    [mascotaId, consultaId, antesDe]
  );
  return filas[0]?.pesoKg ?? null;
}

// Tablas hijas de VARIAS consultas a la vez: 5 consultas en paralelo, no 5 por cada consulta
export async function detallesDeConsultas(ids) {
  if (ids.length === 0) return { diagnosticos: [], hallazgos: [], tratamientos: [], recetas: [], examenes: [] };
  const [[diagnosticos], [hallazgos], [tratamientos], [recetas], [examenes]] = await Promise.all([
    pool.query(
      `SELECT d.consulta_id AS consultaId, pa.id AS padecimientoId, pa.nombre, cp.nombre AS clasificacion, d.descripcion
         FROM diagnosticos d
         JOIN padecimientos pa                 ON pa.id = d.padecimiento_id
         JOIN clasificaciones_padecimiento cp  ON cp.id = pa.clasificacion_id
        WHERE d.consulta_id IN (?) ORDER BY d.fecha`,
      [ids]
    ),
    pool.query(
      "SELECT consulta_id AS consultaId, descripcion FROM hallazgos_consulta WHERE consulta_id IN (?) ORDER BY fecha",
      [ids]
    ),
    pool.query(
      `SELECT consulta_id AS consultaId, descripcion, fecha_inicio AS fechaInicio, duracion_dias AS duracionDias
         FROM tratamientos WHERE consulta_id IN (?)`,
      [ids]
    ),
    pool.query(
      `SELECT re.consulta_id AS consultaId, re.observaciones, ri.medicamento_id AS medicamentoId,
              me.nombre, me.presentacion, ri.dosis, ri.frecuencia, ri.duracion_dias AS duracionDias
         FROM recetas re
         LEFT JOIN receta_items ri ON ri.receta_id = re.id
         LEFT JOIN medicamentos me ON me.id = ri.medicamento_id
        WHERE re.consulta_id IN (?) ORDER BY ri.id`,
      [ids]
    ),
    pool.query(
      `SELECT r.id, r.consulta_id AS consultaId, r.tipo_examen_id AS tipoExamenId, te.nombre AS tipo,
              r.nombre_original AS nombreOriginal, r.mime_type AS mimeType, r.tamano_bytes AS tamanoBytes,
              r.fecha_carga AS fechaCarga
         FROM resultados_examen r JOIN tipos_examen te ON te.id = r.tipo_examen_id
        WHERE r.consulta_id IN (?) ORDER BY r.fecha_carga`,
      [ids]
    ),
  ]);
  return { diagnosticos, hallazgos, tratamientos, recetas, examenes };
}

// Bitácora inalterable: quién abrió el expediente y cuándo
export async function auditar(usuarioId, expedienteId, accion, entidad, entidadId, ip) {
  await pool.query(
    `INSERT INTO auditoria_expediente (usuario_id, expediente_id, accion, entidad, entidad_id, ip)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [usuarioId, expedienteId, accion, entidad, entidadId, ip]
  );
}

// ---------- Catálogos de la consulta ----------

export async function catalogosConsulta() {
  const [[padecimientos], [medicamentos], [tiposExamen], [productosPreventivos]] = await Promise.all([
    pool.query(
      `SELECT pa.id, pa.codigo, pa.nombre, pa.clasificacion_id AS clasificacionId, cp.nombre AS clasificacion
         FROM padecimientos pa JOIN clasificaciones_padecimiento cp ON cp.id = pa.clasificacion_id
        ORDER BY pa.nombre`
    ),
    pool.query("SELECT id, nombre, presentacion FROM medicamentos WHERE estado_id = 801 ORDER BY nombre, presentacion"),
    pool.query("SELECT id, nombre FROM tipos_examen ORDER BY nombre"),
    pool.query("SELECT id, tipo, nombre FROM productos_preventivos ORDER BY tipo DESC, nombre"),
  ]);
  return { padecimientos, medicamentos, tiposExamen, productosPreventivos };
}



// ---------- Guardar y finalizar la consulta ----------

// ¿Existen esos padecimientos / medicamentos ACTIVOS? Devuelve cuántos encontró
export async function contarPadecimientos(ids) {
  if (ids.length === 0) return 0;
  const [[f]] = await pool.query("SELECT COUNT(*) AS total FROM padecimientos WHERE id IN (?)", [ids]);
  return f.total;
}

export async function contarMedicamentosActivos(ids) {
  if (ids.length === 0) return 0;
  const [[f]] = await pool.query("SELECT COUNT(*) AS total FROM medicamentos WHERE id IN (?) AND estado_id = 801", [ids]);
  return f.total;
}

// Guarda SOLO lo que viene en "d" (cada pestaña manda lo suyo), todo en una transacción.
// Las listas (hallazgos, diagnósticos, ítems de receta) se reemplazan completas: se borra y se vuelve a insertar.
export async function guardarConsulta(consultaId, expedienteId, usuarioId, d, ip) {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();

    if (d.signos !== undefined) {
      const s = d.signos ?? {};
      await conexion.query(
        "UPDATE consultas SET peso_kg = ?, temperatura_c = ?, frecuencia_cardiaca = ? WHERE id = ?",
        [s.pesoKg ?? null, s.temperatura ?? null, s.frecuenciaCardiaca ?? null, consultaId]
      );
    }
    if (d.observaciones !== undefined) {
      await conexion.query("UPDATE consultas SET observaciones_generales = ? WHERE id = ?", [d.observaciones || null, consultaId]);
    }
    if (d.hallazgos !== undefined) {
      await conexion.query("DELETE FROM hallazgos_consulta WHERE consulta_id = ?", [consultaId]);
      for (const texto of d.hallazgos) {
        await conexion.query(
          "INSERT INTO hallazgos_consulta (id, consulta_id, descripcion) VALUES (?, ?, ?)",
          [crypto.randomUUID(), consultaId, texto]
        );
      }
    }
    // El tratamiento va antes que los diagnósticos: tratamientos.diagnostico_id apunta a diagnosticos
    if (d.tratamiento !== undefined) {
      await conexion.query("DELETE FROM tratamientos WHERE consulta_id = ?", [consultaId]);
      if (d.tratamiento) {
        await conexion.query(
          "INSERT INTO tratamientos (id, consulta_id, descripcion, fecha_inicio, duracion_dias) VALUES (?, ?, ?, ?, ?)",
          [crypto.randomUUID(), consultaId, d.tratamiento.descripcion, d.tratamiento.fechaInicio, d.tratamiento.duracionDias]
        );
      }
    }
    if (d.diagnosticos !== undefined) {
      await conexion.query("UPDATE tratamientos SET diagnostico_id = NULL WHERE consulta_id = ?", [consultaId]);
      await conexion.query("DELETE FROM diagnosticos WHERE consulta_id = ?", [consultaId]);
      for (const dx of d.diagnosticos) {
        await conexion.query(
          "INSERT INTO diagnosticos (id, consulta_id, padecimiento_id, descripcion) VALUES (?, ?, ?, ?)",
          [crypto.randomUUID(), consultaId, dx.padecimientoId, dx.descripcion]
        );
      }
    }
    if (d.receta !== undefined) {
      const { observaciones, items } = d.receta;
      if (!observaciones && items.length === 0) {
        // Receta vacía: no se deja una receta "fantasma" (los ítems se borran en cascada)
        await conexion.query("DELETE FROM recetas WHERE consulta_id = ?", [consultaId]);
      } else {
        // 1 receta por consulta (uq_receta_consulta): si ya existe, solo se actualiza
        await conexion.query(
          `INSERT INTO recetas (id, consulta_id, observaciones) VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE observaciones = VALUES(observaciones)`,
          [crypto.randomUUID(), consultaId, observaciones || null]
        );
        const [[receta]] = await conexion.query("SELECT id FROM recetas WHERE consulta_id = ?", [consultaId]);
        await conexion.query("DELETE FROM receta_items WHERE receta_id = ?", [receta.id]);
        for (const it of items) {
          await conexion.query(
            "INSERT INTO receta_items (receta_id, medicamento_id, dosis, frecuencia, duracion_dias) VALUES (?, ?, ?, ?, ?)",
            [receta.id, it.medicamentoId, it.dosis, it.frecuencia, it.duracionDias]
          );
        }
      }
    }

    // Bitácora: qué partes de la consulta se modificaron
    await conexion.query(
      `INSERT INTO auditoria_expediente (usuario_id, expediente_id, accion, entidad, entidad_id, detalle, ip)
       VALUES (?, ?, 'MODIFICAR', 'consultas', ?, ?, ?)`,
      [usuarioId, expedienteId, consultaId, JSON.stringify({ campos: Object.keys(d) }), ip]
    );

    await conexion.commit();
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}

// Cierra la consulta y pasa la cita de En curso (503) a Atención finalizada (504)
export async function finalizarConsulta(consulta, usuarioId, ip) {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    const [cierre] = await conexion.query(
      "UPDATE consultas SET fecha_cierre = CURRENT_TIMESTAMP WHERE id = ? AND fecha_cierre IS NULL",
      [consulta.id]
    );
    if (cierre.affectedRows === 0) {
      await conexion.rollback();
      return false;
    }
    if (consulta.citaId) {
      const [cambio] = await conexion.query("UPDATE citas SET estado_id = 504 WHERE id = ? AND estado_id = 503", [consulta.citaId]);
      if (cambio.affectedRows > 0) {
        await conexion.query(
          `INSERT INTO cita_historial_estados (cita_id, estado_anterior_id, estado_nuevo_id, cambiado_por_usuario_id, motivo)
           VALUES (?, 503, 504, ?, 'Finalizó la consulta')`,
          [consulta.citaId, usuarioId]
        );
      }
    }
    await conexion.query(
      `INSERT INTO auditoria_expediente (usuario_id, expediente_id, accion, entidad, entidad_id, detalle, ip)
       VALUES (?, ?, 'MODIFICAR', 'consultas', ?, '{"accion":"FINALIZAR"}', ?)`,
      [usuarioId, consulta.expedienteId, consulta.id, ip]
    );
    await conexion.commit();
    return true;
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}


// ---------- Vacunas y desparasitaciones (dosis_preventivas) ----------

export async function productoExiste(productoId) {
  const [filas] = await pool.query("SELECT 1 FROM productos_preventivos WHERE id = ? LIMIT 1", [productoId]);
  return filas.length > 0;
}

// Nueva dosis PENDIENTE (601) en la cartilla de la mascota (si no tiene cartilla, se le crea)
export async function programarDosis(mascotaId, productoId, fechaProgramada) {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    await conexion.query("INSERT IGNORE INTO cartillas (id, mascota_id) VALUES (?, ?)", [crypto.randomUUID(), mascotaId]);
    const [[cartilla]] = await conexion.query("SELECT id FROM cartillas WHERE mascota_id = ?", [mascotaId]);
    await conexion.query(
      "INSERT INTO dosis_preventivas (id, cartilla_id, producto_id, fecha_programada) VALUES (?, ?, ?, ?)",
      [crypto.randomUUID(), cartilla.id, productoId, fechaProgramada]
    );
    await conexion.commit();
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}

export async function buscarDosis(dosisId) {
  const [filas] = await pool.query(
    `SELECT d.id, d.estado_id AS estadoId, ca.mascota_id AS mascotaId
       FROM dosis_preventivas d JOIN cartillas ca ON ca.id = d.cartilla_id
      WHERE d.id = ?`,
    [dosisId]
  );
  return filas[0] ?? null;
}

// Aplicada HOY por este veterinario, dentro de esta consulta. false = ya estaba aplicada
export async function aplicarDosis(d) {
  const [r] = await pool.query(
    `UPDATE dosis_preventivas
        SET estado_id = 602, fecha_aplicada = ?, aplicada_por_personal_id = ?, consulta_id = ?, lote = ?
      WHERE id = ? AND estado_id <> 602`,
    [d.fecha, d.personalId, d.consultaId, d.lote, d.dosisId]
  );
  return r.affectedRows > 0;
}

// ---------- Exámenes (resultados_examen) ----------

export async function tipoExamenExiste(tipoExamenId) {
  const [filas] = await pool.query("SELECT 1 FROM tipos_examen WHERE id = ? LIMIT 1", [tipoExamenId]);
  return filas.length > 0;
}

export async function insertarExamen(e) {
  await pool.query(
    `INSERT INTO resultados_examen
       (id, expediente_id, consulta_id, tipo_examen_id, archivo_url, nombre_original, mime_type, tamano_bytes, subido_por_usuario_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [crypto.randomUUID(), e.expedienteId, e.consultaId, e.tipoExamenId, e.archivoUrl, e.nombreOriginal,
     e.mimeType, e.tamanoBytes, e.usuarioId]
  );
}

export async function buscarExamen(examenId) {
  const [filas] = await pool.query(
    `SELECT id, expediente_id AS expedienteId, archivo_url AS archivoUrl,
            nombre_original AS nombreOriginal, mime_type AS mimeType
       FROM resultados_examen WHERE id = ?`,
    [examenId]
  );
  return filas[0] ?? null;
}

// ---------- Receta en PDF ----------

// Lo que la receta muestra además de la consulta: datos de la clínica y licencia del veterinario
export async function datosParaReceta(consultaId) {
  const [filas] = await pool.query(
    `SELECT cl.nombre_comercial AS clinica, cl.direccion, cl.telefono, pv.numero_licencia AS licencia
       FROM consultas co
       JOIN personal_clinica pc ON pc.id = co.personal_id
       JOIN clinicas cl         ON cl.id = pc.clinica_id
       LEFT JOIN perfil_veterinario pv ON pv.usuario_id = pc.usuario_id
      WHERE co.id = ?`,
    [consultaId]
  );
  return filas[0] ?? null;
}