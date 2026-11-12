

// Reportes de rendimiento de la red (REQ-021): total de citas por clínica,
// propietarios nuevos y frecuencia de servicios. Lo usan la pantalla y el PDF.

import { ErrorHttp } from "../utils/errores.js";
import { esFechaValida, fechaHoraManagua, hoyLocal } from "../utils/fechas.js";
import * as repo from "../repositories/superReportes.repository.js";

const MAX_DIAS = 366;

const SERVICIOS = [
  { clave: "consultas", nombre: "Consultas atendidas" },
  { clave: "vacunas", nombre: "Vacunación" },
  { clave: "desparasitaciones", nombre: "Desparasitación" },
  { clave: "recetas", nombre: "Recetas emitidas" },
  { clave: "examenes", nombre: "Exámenes cargados" },
  { clave: "emergencias", nombre: "Emergencias atendidas" },
];

// Porcentaje entero, o null si no hay base (para no mostrar "NaN %")
const porcentaje = (parte, base) => (base > 0 ? Math.round((parte / base) * 100) : null);

const diasEntre = (a, b) => Math.round((new Date(`${b}T00:00:00Z`) - new Date(`${a}T00:00:00Z`)) / 86400000);

// "2026-11-15" → "2026-06-01" (el primer día de 5 meses antes): así la gráfica muestra 6 meses
function inicioDeMeses(fecha, mesesAtras) {
  const d = new Date(`${fecha.slice(0, 7)}-01T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() - mesesAtras);
  return d.toISOString().slice(0, 10);
}

// Lista de meses "AAAA-MM" desde/hasta, para rellenar con 0 los meses sin registros
function listaMeses(desde, hasta) {
  const meses = [];
  const d = new Date(`${desde.slice(0, 7)}-01T00:00:00Z`);
  while (d.toISOString().slice(0, 7) <= hasta.slice(0, 7)) {
    meses.push(d.toISOString().slice(0, 7));
    d.setUTCMonth(d.getUTCMonth() + 1);
  }
  return meses;
}

// Revisa los filtros de la URL. Sin fechas = del día 1 del mes actual hasta hoy.
function normalizar({ desde, hasta, clinicaId }) {
  const hoy = hoyLocal();
  const f = {
    desde: desde || `${hoy.slice(0, 7)}-01`,
    hasta: hasta || hoy,
    clinicaId: clinicaId || null,
  };
  if (!esFechaValida(f.desde)) throw new ErrorHttp(400, "La fecha «desde» no es válida", "desde");
  if (!esFechaValida(f.hasta)) throw new ErrorHttp(400, "La fecha «hasta» no es válida", "hasta");
  if (f.desde > f.hasta) throw new ErrorHttp(400, "La fecha «desde» debe ser antes de «hasta»", "desde");
  if (diasEntre(f.desde, f.hasta) > MAX_DIAS) throw new ErrorHttp(400, "El período puede ser de máximo un año", "desde");
  return f;
}

export async function generar(filtros) {
  const f = normalizar(filtros);
  const inicioGrafica = inicioDeMeses(f.hasta, 5);

  const [porClinica, porMes, nuevos, servicios, nombreClinica] = await Promise.all([
    repo.citasPorClinica(f),
    repo.propietariosPorMes(inicioGrafica, f.hasta),
    repo.propietariosNuevos(f.desde, f.hasta),
    repo.frecuenciaServicios(f),
    f.clinicaId ? repo.nombreClinica(f.clinicaId) : null,
  ]);
  if (f.clinicaId && !nombreClinica) throw new ErrorHttp(404, "No encontramos esa clínica");

  // Totales de la red = suma de todas las clínicas
  const suma = (campo) => porClinica.reduce((total, c) => total + Number(c[campo]), 0);
  const resumen = {
    citas: suma("total"),
    atendidas: suma("atendidas"),
    canceladas: suma("canceladas"),
    noAsistio: suma("noAsistio"),
    pendientes: suma("pendientes"),
    propietariosNuevos: Number(nuevos),
  };

  const totalServicios = SERVICIOS.reduce((t, s) => t + Number(servicios[s.clave]), 0);
  const mesesConDatos = Object.fromEntries(porMes.map((m) => [m.mes, m]));

  return {
    periodo: { desde: f.desde, hasta: f.hasta },
    clinica: f.clinicaId ? { id: f.clinicaId, nombre: nombreClinica } : null,
    generadoEn: fechaHoraManagua(),
    resumen: {
      ...resumen,
      // De las citas que ya pasaron (atendidas + no asistió), ¿cuántas se atendieron?
      asistencia: porcentaje(resumen.atendidas, resumen.atendidas + resumen.noAsistio),
      cancelacion: porcentaje(resumen.canceladas, resumen.citas),
    },
    porClinica: porClinica.map((c) => ({
      clinicaId: c.clinicaId,
      nombre: c.nombre,
      activa: c.estadoId === 201,
      total: Number(c.total),
      atendidas: Number(c.atendidas),
      canceladas: Number(c.canceladas),
      noAsistio: Number(c.noAsistio),
      pendientes: Number(c.pendientes),
      asistencia: porcentaje(Number(c.atendidas), Number(c.atendidas) + Number(c.noAsistio)),
      cancelacion: porcentaje(Number(c.canceladas), Number(c.total)),
    })),
    propietariosPorMes: listaMeses(inicioGrafica, f.hasta).map((mes) => {
      const m = mesesConDatos[mes];
      const total = m ? Number(m.total) : 0;
      const porSuCuenta = m ? Number(m.porSuCuenta) : 0;
      return { mes, total, porSuCuenta, porRecepcion: total - porSuCuenta };
    }),
    servicios: SERVICIOS.map((s) => ({
      clave: s.clave,
      nombre: s.nombre,
      total: Number(servicios[s.clave]),
      porcentaje: porcentaje(Number(servicios[s.clave]), totalServicios),
    })),
  };
}