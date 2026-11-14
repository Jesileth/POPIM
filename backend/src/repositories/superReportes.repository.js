
//

// Números de toda la red para los reportes del Super Administrador (REQ-021). Aquí solo hay SQL.
// f = { desde: "AAAA-MM-DD", hasta: "AAAA-MM-DD", clinicaId: "uuid" | null }

import { pool } from "../config/db.js";

// "Si no eligió clínica, todas; si eligió, solo esa". Se usa con dos "?" seguidos: [clinicaId, clinicaId]
const FILTRO_CLINICA = "(? IS NULL OR pc.clinica_id = ?)";

// Citas del período agrupadas por clínica y por cómo terminaron.
// LEFT JOIN: una clínica sin citas sale igual, con ceros.
export async function citasPorClinica({ desde, hasta, clinicaId }) {
  const [filas] = await pool.query(
    `SELECT c.id AS clinicaId, c.nombre_comercial AS nombre, c.estado_id AS estadoId,
            COUNT(ci.id)                                    AS total,
            COALESCE(SUM(ci.estado_id = 504), 0)            AS atendidas,
            COALESCE(SUM(ci.estado_id = 505), 0)            AS canceladas,
            COALESCE(SUM(ci.estado_id = 506), 0)            AS noAsistio,
            COALESCE(SUM(ci.estado_id IN (501, 502, 503)), 0) AS pendientes
       FROM clinicas c
       LEFT JOIN personal_clinica pc ON pc.clinica_id = c.id
       LEFT JOIN citas ci            ON ci.veterinario_id = pc.id AND ci.fecha BETWEEN ? AND ?
      WHERE (? IS NULL OR c.id = ?)
      GROUP BY c.id, c.nombre_comercial, c.estado_id
      ORDER BY total DESC, c.nombre_comercial`,
    [desde, hasta, clinicaId, clinicaId]
  );
  return filas;
}

// Propietarios registrados por mes. creado_por_usuario_id NULL = se registró solo desde su portal;
// con valor = lo registró una recepción. (Los propietarios no pertenecen a una clínica.)
export async function propietariosPorMes(desde, hasta) {
  const [filas] = await pool.query(
    `SELECT DATE_FORMAT(u.fecha_registro, '%Y-%m')  AS mes,
            COUNT(*)                                AS total,
            SUM(u.creado_por_usuario_id IS NULL)    AS porSuCuenta
       FROM usuarios u
       JOIN usuario_roles ur ON ur.usuario_id = u.id
       JOIN roles r          ON r.id = ur.rol_id AND r.codigo = 'PROPIETARIO'
      WHERE u.fecha_registro >= ? AND u.fecha_registro < ? + INTERVAL 1 DAY
      GROUP BY mes
      ORDER BY mes`,
    [desde, hasta]
  );
  return filas;
}

export async function propietariosNuevos(desde, hasta) {
  const [filas] = await pool.query(
    `SELECT COUNT(*) AS total
       FROM usuarios u
       JOIN usuario_roles ur ON ur.usuario_id = u.id
       JOIN roles r          ON r.id = ur.rol_id AND r.codigo = 'PROPIETARIO'
      WHERE u.fecha_registro >= ? AND u.fecha_registro < ? + INTERVAL 1 DAY`,
    [desde, hasta]
  );
  return filas[0].total;
}

// Frecuencia de servicios: cuántas veces se hizo cada cosa en el período.
// Cada subconsulta llega a la clínica por el personal que lo hizo (pc = personal_clinica).
export async function frecuenciaServicios({ desde, hasta, clinicaId }) {
  const rango = (columna) => `${columna} >= ? AND ${columna} < ? + INTERVAL 1 DAY`;
  const consultas = (emergencia) => `
       (SELECT COUNT(*) FROM consultas co
          JOIN citas ci            ON ci.id = co.cita_id
          JOIN personal_clinica pc ON pc.id = co.personal_id
         WHERE ${rango("co.fecha_cierre")} AND ci.es_emergencia = ${emergencia} AND ${FILTRO_CLINICA})`;
  const dosis = (tipo) => `
       (SELECT COUNT(*) FROM dosis_preventivas d
          JOIN productos_preventivos pp ON pp.id = d.producto_id
          JOIN personal_clinica pc      ON pc.id = d.aplicada_por_personal_id
         WHERE d.estado_id = 602 AND d.fecha_aplicada BETWEEN ? AND ? AND pp.tipo = '${tipo}' AND ${FILTRO_CLINICA})`;

  const [filas] = await pool.query(
    `SELECT ${consultas("FALSE")} AS consultas,
            ${consultas("TRUE")}  AS emergencias,
            ${dosis("VACUNA")}         AS vacunas,
            ${dosis("DESPARASITANTE")} AS desparasitaciones,
            (SELECT COUNT(*) FROM resultados_examen re
               LEFT JOIN consultas co        ON co.id = re.consulta_id
               LEFT JOIN personal_clinica pc ON pc.id = co.personal_id
              WHERE ${rango("re.fecha_carga")} AND ${FILTRO_CLINICA}) AS examenes,
            (SELECT COUNT(*) FROM recetas rc
               JOIN consultas co        ON co.id = rc.consulta_id
               JOIN personal_clinica pc ON pc.id = co.personal_id
              WHERE ${rango("rc.fecha")} AND ${FILTRO_CLINICA}) AS recetas`,
    // Cada subconsulta usa 4 "?": las 2 fechas y las 2 de la clínica (6 subconsultas)
    Array(6).fill([desde, hasta, clinicaId, clinicaId]).flat()
  );
  return filas[0];
}

export async function nombreClinica(clinicaId) {
  const [filas] = await pool.query("SELECT nombre_comercial AS nombre FROM clinicas WHERE id = ?", [clinicaId]);
  return filas[0]?.nombre ?? null;
}