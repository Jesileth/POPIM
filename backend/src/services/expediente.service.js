
// busun busun 

import { ErrorHttp } from "../utils/errores.js";
import { aMomentoUtc, hoyLocal } from "../utils/fechas.js";
import * as mascotasRepo from "../repositories/mascotas.repository.js";
import * as expedienteRepo from "../repositories/expediente.repository.js";

// La regla importante: solo el dueño de la mascota ve sus datos
async function verificarMascota(usuarioId, mascotaId) 
{
  const propietarioId = await mascotasRepo.obtenerPropietarioId(usuarioId);
  if (!propietarioId) throw new ErrorHttp(403, "Tu cuenta no es de un propietario");

  const mascota = await mascotasRepo.buscarDePropietario(mascotaId, propietarioId);
  if (!mascota) throw new ErrorHttp(404, "No encontramos esa mascota");
}

// Un examen con la forma que espera FilaExamen (se usa en la lista y en el detalle)
const aExamen = (f) => ({
  id: f.id,
  mascotaId: f.mascotaId,
  consultaId: f.consultaId,
  tipoExamen: { id: f.tipoId, nombre: f.tipoNombre },
  nombreOriginal: f.nombreOriginal,
  mimeType: f.mimeType,
  tamanoBytes: f.tamanoBytes,
  fechaCarga: aMomentoUtc(f.fechaCarga),
});

export async function cartilla(usuarioId, mascotaId) {
  await verificarMascota(usuarioId, mascotaId);
  const filas = await expedienteRepo.listarDosis(mascotaId);
  const hoy = hoyLocal();

  return {
    dosis: filas.map((f) => ({
      id: f.id,
      producto: { id: f.productoId, tipo: f.productoTipo, nombre: f.productoNombre },
      fechaProgramada: f.fechaProgramada,
      fechaAplicada: f.fechaAplicada,
      
      // Una dosis pendiente cuya fecha ya pasó se muestra como VENCIDA
      estado:
        f.estadoCodigo === "PENDIENTE" && f.fechaProgramada < hoy
          ? { id: 603, codigo: "VENCIDA", nombre: "Vencida" }
          : { id: f.estadoId, codigo: f.estadoCodigo, nombre: f.estadoNombre },
      lote: f.lote,
      observaciones: f.observaciones,
      aplicadaPor: f.aplicadaPor,
      clinicaId: f.clinicaId,
    })),
  };
}

export async function consultas(usuarioId, mascotaId) {
  await verificarMascota(usuarioId, mascotaId);
  const filas = await expedienteRepo.listarConsultas(mascotaId);

  return {
    consultas: filas.map((f) => ({
      id: f.id,
      fechaInicio: aMomentoUtc(f.fechaInicio),
      esEmergencia: Boolean(f.esEmergencia),
      prioridad: f.prioridad,
      motivo: f.motivo,
      veterinario: f.vetNombre
        ? { nombreCompleto: f.vetNombre, especialidad: f.vetEspecialidad }
        : null,
      totalDiagnosticos: f.totalDiagnosticos,
      tieneReceta: Boolean(f.tieneReceta),
      totalExamenes: f.totalExamenes,
    })),
  };
}

export async function examenes(usuarioId, mascotaId) {
  await verificarMascota(usuarioId, mascotaId);
  const filas = await expedienteRepo.listarExamenes(mascotaId);

    return { examenes: filas.map(aExamen) };
}

export async function consulta(usuarioId, consultaId) {
  // Misma regla que en verificarMascota: primero, ¿es una cuenta de propietario?
  const propietarioId = await mascotasRepo.obtenerPropietarioId(usuarioId);
  if (!propietarioId) throw new ErrorHttp(403, "Tu cuenta no es de un propietario");

  // Si no existe, no es suya o no está finalizada → el mismo 404 (así no se puede adivinar ids)
  const f = await expedienteRepo.buscarConsulta(consultaId, propietarioId);
  if (!f) throw new ErrorHttp(404, "No encontramos esa consulta");

  const d = await expedienteRepo.detalleConsulta(consultaId);
  const receta = d.recetas[0]; // hay máximo una receta por consulta (uq_receta_consulta)

  return {
    consulta: {
      id: f.id,
      fechaInicio: aMomentoUtc(f.fechaInicio),
      esEmergencia: Boolean(f.esEmergencia),
      prioridad: f.prioridad ?? "NORMAL",
      mascota: { id: f.mascotaId, nombre: f.mascotaNombre },
      veterinario: f.vetNombre ? { nombreCompleto: f.vetNombre, especialidad: f.vetEspecialidad } : null,
      clinica: f.clinicaNombre ? { nombreComercial: f.clinicaNombre } : null,
      cita: f.motivoConsulta ? { motivoConsulta: f.motivoConsulta } : null,
      pesoKg: f.pesoKg,
      temperaturaC: f.temperaturaC,
      frecuenciaCardiaca: f.frecuenciaCardiaca,
      observacionesGenerales: f.observacionesGenerales,
      hallazgos: d.hallazgos,
      diagnosticos: d.diagnosticos.map((x) => ({
        id: x.id,
        descripcion: x.descripcion,
        padecimiento: { nombre: x.padecimientoNombre, codigo: x.padecimientoCodigo, clasificacion: x.clasificacion },
      })),
      tratamientos: d.tratamientos,
      receta: receta
        ? {
            fecha: aMomentoUtc(receta.fecha),
            observaciones: receta.observaciones,
            items: d.items.map((i) => ({
              id: i.id,
              medicamento: { nombre: i.medicamentoNombre, presentacion: i.medicamentoPresentacion },
              dosis: i.dosis,
              frecuencia: i.frecuencia,
              duracionDias: i.duracionDias,
            })),
          }
        : null,
      examenes: d.examenes.map(aExamen),
      dosisAplicadas: d.dosis.map((x) => ({
        id: x.id,
        producto: { nombre: x.productoNombre },
        fechaAplicada: x.fechaAplicada,
        lote: x.lote,
      })),
    },
  };
}