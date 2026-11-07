import { peticion } from "@/lib/api";
import { simular } from "@/lib/simulador";
import * as m from "@/lib/mockClinica";

// Busca por cédula, teléfono, correo o nombre.
// encodeURIComponent: si escriben "María López" el espacio y la tilde viajan bien en la URL
export function buscarPropietarios(texto) {
  return peticion(`/clinica/propietarios/buscar?q=${encodeURIComponent(texto)}`);
}

// Mascotas activas de un propietario
export function obtenerMascotasDePropietario(propietarioId) {
  return peticion(`/clinica/propietarios/${propietarioId}/mascotas`);
}

// ---------------------------------------------------------------------------
// Traído del proyecto de tu compañero (Consulta y Registro de propietarios).
// TEMPORAL: todavía leen del mock en memoria (lib/mockClinica.js) con `simular`.
// ---------------------------------------------------------------------------

export const listarPropietarios = simular(m.listarPropietarios);
export const obtenerPropietario = simular(m.obtenerPropietario);
export const registrarPropietario = simular(m.registrarPropietario, 500);
export const actualizarPropietario = simular(m.actualizarPropietario);
export const reenviarCodigo = simular(m.reenviarCodigo);

