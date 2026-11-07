import { peticion } from "@/lib/api";

// Busca por cédula, teléfono, correo o nombre (lo usa Nueva cita)
// encodeURIComponent: si escriben "María López" el espacio y la tilde viajan bien en la URL
export function buscarPropietarios(texto) {
  return peticion(`/clinica/propietarios/buscar?q=${encodeURIComponent(texto)}`);
}

// Mascotas activas de un propietario (lo usa Nueva cita)
export function obtenerMascotasDePropietario(propietarioId) {
  return peticion(`/clinica/propietarios/${propietarioId}/mascotas`);
}

// Antes TEMPORALES (mock). Ahora hablan con el backend con la misma forma.
export const listarPropietarios = () => peticion("/clinica/propietarios");
export const obtenerPropietario = (id) => peticion(`/clinica/propietarios/${id}`);
export const registrarPropietario = (datos) => peticion("/clinica/propietarios", { metodo: "POST", cuerpo: datos });
export const actualizarPropietario = (id, datos) => peticion(`/clinica/propietarios/${id}`, { metodo: "PUT", cuerpo: datos });
export const reenviarCodigo = (id) => peticion(`/clinica/propietarios/${id}/reenviar-codigo`, { metodo: "POST" });