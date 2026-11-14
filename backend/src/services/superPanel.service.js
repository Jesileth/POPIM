

// Panel general del Super Administrador: un resumen de toda la red y lo que requiere atención.
// Los números del mes salen del MISMO cálculo que Reportes globales, para que siempre coincidan.

import { aMomentoUtc } from "../utils/fechas.js";
import * as repo from "../repositories/superPanel.repository.js";
import { generar as generarReporte } from "./superReportes.service.js";

export async function obtener() {
    
  // Sin filtros, el reporte es "del día 1 de este mes hasta hoy" y de todas las clínicas
  const [reporte, clinicas, sinAdmin, cuentas, recientes] = await Promise.all([
    generarReporte({}),
    repo.contarClinicas(),
    repo.clinicasSinAdministrador(),
    repo.contarCuentas(),
    repo.clinicasRecientes(),
  ]);

  const servicio = (clave) => reporte.servicios.find((s) => s.clave === clave)?.total ?? 0;

  // Avisos: solo se mandan los que de verdad tienen algo
  const alertas = [];
  if (sinAdmin.length > 0) {
    alertas.push({
      tipo: "SIN_ADMINISTRADOR",
      texto: sinAdmin.length === 1
        ? `${sinAdmin[0].nombre} no tiene administrador.`
        : `${sinAdmin.length} clínicas activas no tienen administrador.`,
      // Con una sola clínica, el enlace lleva directo a editarla
      clinicaId: sinAdmin.length === 1 ? sinAdmin[0].id : null,
    });
  }
  if (cuentas.bloqueadas > 0) {
    alertas.push({ tipo: "CUENTAS_BLOQUEADAS", texto: `${cuentas.bloqueadas} ${cuentas.bloqueadas === 1 ? "cuenta bloqueada" : "cuentas bloqueadas"} en la red.` });
  }
  if (cuentas.adminsPendientes > 0) {
    alertas.push({
      tipo: "ADMINS_PENDIENTES",
      texto: `${cuentas.adminsPendientes} ${cuentas.adminsPendientes === 1 ? "administrador no ha" : "administradores no han"} activado su cuenta.`,
    });
  }
  const inactivas = clinicas.total - clinicas.activas;
  if (inactivas > 0) {
    alertas.push({ tipo: "CLINICAS_INACTIVAS", texto: `${inactivas} ${inactivas === 1 ? "clínica está inactiva" : "clínicas están inactivas"}.` });
  }

  return {
    periodo: reporte.periodo,
    cifras: {
      clinicasActivas: clinicas.activas,
      clinicasTotal: clinicas.total,
      citasMes: reporte.resumen.citas,
      citasPendientes: reporte.resumen.pendientes,
      propietariosNuevos: reporte.resumen.propietariosNuevos,
      consultasAtendidas: servicio("consultas") + servicio("emergencias"),
      emergencias: servicio("emergencias"),
    },
    // Las 6 clínicas con más citas en el mes (las que no tienen citas no se muestran)
    topClinicas: reporte.porClinica
      .filter((c) => c.total > 0)
      .slice(0, 6)
      .map((c) => ({ clinicaId: c.clinicaId, nombre: c.nombre, total: c.total })),
    alertas,
    recientes: recientes.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      direccion: c.direccion,
      activa: c.estadoId === 201,
      sinAdministrador: Boolean(c.sinAdministrador),
      fechaRegistro: aMomentoUtc(c.fechaRegistro),
    })),
  };
}