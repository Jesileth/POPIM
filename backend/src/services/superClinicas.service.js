
//

// Reglas del módulo Clínicas del Super Administrador (REQ-020)

import { ErrorHttp } from "../utils/errores.js";
import { aMomentoUtc } from "../utils/fechas.js";
import * as repo from "../repositories/superClinicas.repository.js";
import * as usuariosRepo from "../repositories/usuarios.repository.js";

// estado_id de usuarios → texto que entiende el frontend
const ESTADO_CUENTA = { 101: "PENDIENTE", 102: "ACTIVO", 103: "BLOQUEADO", 104: "INACTIVO", 105: "PROVISIONAL" };

// Traduce los índices únicos de MySQL al campo del formulario que falló
function errorDuplicado(error) {
  if (error.code !== "ER_DUP_ENTRY") return null;
  const m = error.sqlMessage || "";
  if (m.includes("uq_clinicas_ruc")) return new ErrorHttp(409, "Ya existe una clínica con ese RUC", "ruc");
  if (m.includes("uq_usuarios_correo")) return new ErrorHttp(409, "Ese correo ya está registrado", "adminCorreo");
  if (m.includes("uq_usuarios_telefono")) return new ErrorHttp(409, "Ese teléfono ya está registrado", "adminTelefono");
  return new ErrorHttp(409, "Ya existe un registro con esos datos");
}

const formatear = (f) => ({
  id: f.id,
  razonSocial: f.razonSocial,
  nombreComercial: f.nombreComercial,
  ruc: f.ruc,
  direccion: f.direccion,
  telefono: f.telefono,
  correo: f.correo,
  logoUrl: f.logoUrl,
  duracionCitaMin: f.duracionCitaMin,
  activa: f.estadoId === 201,
  fechaRegistro: aMomentoUtc(f.fechaRegistro),
});

// Solo los datos de la clínica (sin horarios ni administrador)
const soloClinica = (d) => ({
  razonSocial: d.razonSocial, nombreComercial: d.nombreComercial, ruc: d.ruc, direccion: d.direccion,
  telefono: d.telefono, correo: d.correo, duracionCitaMin: d.duracionCitaMin,
});

// estado: "ACTIVAS", "INACTIVAS" o vacío (todas)
export async function listar({ q, estado }) {
  const estadoId = estado === "ACTIVAS" ? 201 : estado === "INACTIVAS" ? 202 : null;
  const filas = await repo.listar({ q: q?.trim() || null, estadoId });
  return {
    clinicas: filas.map((f) => ({
      ...formatear(f),
      administrador: f.adminNombre
        ? { nombreCompleto: f.adminNombre, estado: ESTADO_CUENTA[f.adminEstadoId] }
        : null,
      personalActivo: f.personalActivo,
      citasMes: f.citasMes,
      citasFuturas: f.citasFuturas, // solicitadas o confirmadas de hoy en adelante
    })),
  };
}

export async function obtener(clinicaId) {
  const [clinica, horarios, admin] = await Promise.all([
    repo.buscar(clinicaId),
    repo.horariosDe(clinicaId),
    repo.administradorDe(clinicaId),
  ]);
  if (!clinica) throw new ErrorHttp(404, "No encontramos esa clínica");
  return {
    clinica: {
      ...formatear(clinica),
      horarios,
      administrador: admin
        ? {
            nombreCompleto: admin.nombreCompleto, correo: admin.correo,
            telefono: admin.telefono, estado: ESTADO_CUENTA[admin.estadoId],
          }
        : null,
    },
  };
}

// Si el correo del administrador ya tiene cuenta: devuelve su id (se reutiliza).
// No se permite si ya trabaja en el portal con otro rol o si ya está en otra clínica,
// porque una cuenta del personal pertenece a UNA clínica.
async function revisarAdministrador(correo) {
  const existente = await usuariosRepo.buscarPorCorreo(correo);
  if (!existente) return null;

  const roles = await repo.rolesClinicaDe(existente.id);
  if (roles.some((r) => r !== "ADMINISTRADOR"))
    throw new ErrorHttp(409, "Ese correo ya trabaja en el portal de clínicas con otro rol", "adminCorreo");

  const vinculo = await repo.vinculoActivoDe(existente.id);
  if (vinculo) throw new ErrorHttp(409, `Ese correo ya administra la clínica ${vinculo.clinica}`, "adminCorreo");

  return existente.id;
}

export async function registrar(superAdminId, d) {
  const existenteId = await revisarAdministrador(d.adminCorreo);
  try {
    const clinicaId = await repo.crear({
      clinica: soloClinica(d),
      horarios: d.horarios,
      activa: d.activa,
      admin: { existenteId, nombreCompleto: d.adminNombre, correo: d.adminCorreo, telefono: d.adminTelefono },
      creadoPor: superAdminId,
    });
    return obtener(clinicaId);
  } catch (error) {
    throw errorDuplicado(error) ?? error;
  }
}

// Para una clínica que no tiene administrador activo
export async function asignarAdministrador(superAdminId, clinicaId, d) {
  const [clinica, actual] = await Promise.all([repo.buscar(clinicaId), repo.administradorDe(clinicaId)]);
  if (!clinica) throw new ErrorHttp(404, "No encontramos esa clínica");
  if (actual) throw new ErrorHttp(409, `Esta clínica ya tiene administrador: ${actual.nombreCompleto}`);

  const existenteId = await revisarAdministrador(d.adminCorreo);
  try {
    await repo.asignarAdministrador(
      clinicaId,
      { existenteId, nombreCompleto: d.adminNombre, correo: d.adminCorreo, telefono: d.adminTelefono },
      superAdminId
    );
  } catch (error) {
    throw errorDuplicado(error) ?? error;
  }
  return obtener(clinicaId);
}


export async function actualizar(clinicaId, d) {
  try {
    const hecho = await repo.actualizar(clinicaId, { clinica: soloClinica(d), horarios: d.horarios });
    if (!hecho) throw new ErrorHttp(404, "No encontramos esa clínica");
  } catch (error) {
    throw errorDuplicado(error) ?? error;
  }
  return obtener(clinicaId);
}

// Inactiva (202): con lo que ya existe en el backend, al instante
//  - desaparece de la lista de clínicas del propietario (listarClinicas filtra 201),
//  - no se pueden pedir citas nuevas (datosDeAgenda exige clínica 201),
//  - su personal no entra a las pantallas /clinica/... (buscarVinculo exige clínica 201).
// Las citas ya agendadas NO se borran (por eso la pantalla avisa cuántas hay).
export async function cambiarEstado(clinicaId, activa) {
  const hecho = await repo.cambiarEstado(clinicaId, activa ? 201 : 202);
  if (!hecho) throw new ErrorHttp(404, "No encontramos esa clínica");
  return { id: clinicaId, activa };
}