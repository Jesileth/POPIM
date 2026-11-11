
//

// Reglas de Propietarios y Mascotas en la clínica (recepción)

import { ErrorHttp } from "../utils/errores.js";
import * as repo from "../repositories/propietariosClinica.repository.js";
import * as catalogosRepo from "../repositories/catalogos.repository.js";
import * as mascotasRepo from "../repositories/mascotas.repository.js";
import { generarCodigo } from "./mascotas.service.js";
import * as authService from "./auth.service.js";

// Los mismos índices únicos que ya traduce el registro del propietario
function errorDuplicado(error) {
  if (error.code !== "ER_DUP_ENTRY") return null;
  const m = error.sqlMessage || "";
  if (m.includes("uq_usuarios_correo")) return new ErrorHttp(409, "Ese correo ya está registrado", "correo");
  if (m.includes("uq_usuarios_telefono")) return new ErrorHttp(409, "Ese teléfono ya está registrado", "telefono");
  if (m.includes("uq_prop_cedula")) return new ErrorHttp(409, "Esa cédula ya está registrada", "cedula");
  return null;
}

// El código PET es aleatorio: si por casualidad ya existe, se intenta con otro (hasta 5 veces)
async function conCodigoUnico(crear) {
  for (let intento = 0; intento < 5; intento++) {
    try {
      return await crear(generarCodigo());
    } catch (error) {
      const codigoRepetido = error.code === "ER_DUP_ENTRY" && (error.sqlMessage || "").includes("uq_mascota_codigo");
      if (!codigoRepetido) throw errorDuplicado(error) ?? error;
    }
  }
  throw new ErrorHttp(500, "No pudimos generar el código único. Intenta de nuevo.");
}

async function validarEspecieYRaza(m) {
  if (!(await catalogosRepo.existeEspecie(m.especieId))) throw new ErrorHttp(400, "La especie no es válida", "especieId");
  if (m.razaId && !(await mascotasRepo.razaPerteneceAEspecie(m.razaId, m.especieId)))
    throw new ErrorHttp(400, "La raza no corresponde a la especie elegida", "razaId");
}

const formatearMascota = (f) => ({
  id: f.id, nombre: f.nombre, codigoUnico: f.codigoUnico, especie: f.especie, raza: f.raza,
  sexo: f.sexo, edadActualMeses: f.edadActualMeses,
});

// ---------- Propietarios ----------
export async function listar() {
  const filas = await repo.listar();
  return {
    propietarios: filas.map((f) => ({
      id: f.id, nombreCompleto: f.nombreCompleto, telefono: f.telefono, cedula: f.cedula,
      correo: f.correo, direccion: f.direccion, estado: f.estado, // ACTIVO, PENDIENTE, PROVISIONAL…
      totalMascotas: f.totalMascotas, codigosMascotas: f.codigos ? f.codigos.split(",") : [],
    })),
  };
}

export async function obtener(propietarioId) {
  const [p, mascotas] = await Promise.all([repo.buscar(propietarioId), repo.mascotasDe(propietarioId)]);
  if (!p) throw new ErrorHttp(404, "No encontramos a ese propietario");
  return {
    propietario: {
      id: p.id, nombreCompleto: p.nombreCompleto, telefono: p.telefono, cedula: p.cedula,
      correo: p.correo, direccion: p.direccion, estado: p.estado,
    },
    mascotas: mascotas.map(formatearMascota),
  };
}

// tipo PROPIETARIO → cuenta PENDIENTE (101): activará su cuenta con "Activar mi cuenta"
// tipo OTRA        → cuenta PROVISIONAL (105): sin credenciales hasta que venga el dueño
export async function registrar(usuarioId, d) {
  await validarEspecieYRaza(d.mascota);
  const ids = await conCodigoUnico((codigoUnico) =>
    repo.crearConMascota({
      ...d.propietario,
      estadoId: d.tipo === "PROPIETARIO" ? 101 : 105,
      creadoPor: usuarioId,
      mascota: { ...d.mascota, codigoUnico },
    })
  );
  return { propietario: { id: ids.propietarioId }, mascota: { id: ids.mascotaId } };
}

export async function actualizar(propietarioId, d) {
  const p = await repo.buscar(propietarioId);
  if (!p) throw new ErrorHttp(404, "No encontramos a ese propietario");
  if (p.estadoId === 102) throw new ErrorHttp(403, "La cuenta ya está activa: solo el propietario puede cambiar sus datos.");
  if (!p.creadoPor) throw new ErrorHttp(403, "Este propietario se registró solo: la clínica no puede cambiar sus datos.");

  try {
    await repo.actualizar(propietarioId, p.usuarioId, d);
  } catch (error) {
    throw errorDuplicado(error) ?? error;
  }
  return obtener(propietarioId);
}

// Le manda el código de activación al correo guardado (mismo flujo que "Activar mi cuenta")
export async function reenviarCodigo(propietarioId) {
  const p = await repo.buscar(propietarioId);
  if (!p) throw new ErrorHttp(404, "No encontramos a ese propietario");
  if (p.estadoId !== 101) throw new ErrorHttp(409, "Solo se envía el código a cuentas pendientes de activar.");
  if (!p.correo) throw new ErrorHttp(400, "Agrega un correo para poder enviar el código de activación.", "correo");
  const r = await authService.buscarPerfilPendiente(p.correo);
  return { enviadoA: r.correoEnmascarado };
}

// ---------- Mascotas ----------
export async function listarMascotas() {
  const filas = await repo.listarMascotas();
  return {
    mascotas: filas.map((f) => ({
      ...formatearMascota(f),
      propietario: { id: f.propietarioId, nombreCompleto: f.propietarioNombre, telefono: f.propietarioTelefono },
    })),
  };
}

export async function obtenerMascota(mascotaId, clinicaId) {
  const [f, citas] = await Promise.all([repo.buscarMascota(mascotaId), repo.citasDeMascota(mascotaId, clinicaId)]);
  if (!f) throw new ErrorHttp(404, "No encontramos esa mascota");
  return {
    mascota: formatearMascota(f),
    propietario: { id: f.propietarioId, nombreCompleto: f.propietarioNombre, telefono: f.propietarioTelefono },
    citas: citas.map((c) => ({
      id: c.id, fecha: c.fecha, motivoConsulta: c.motivoConsulta, estado: c.estado,
      veterinario: { nombreCompleto: c.veterinario },
    })),
  };
}

export async function registrarMascota(usuarioId, propietarioId, d) {
  if (!(await repo.buscar(propietarioId))) throw new ErrorHttp(404, "Elige un propietario válido");
  await validarEspecieYRaza(d);
  const mascotaId = await conCodigoUnico((codigoUnico) =>
    repo.crearMascota({ ...d, codigoUnico, propietarioId, creadoPor: usuarioId })
  );
  return { mascota: { id: mascotaId } };
}