

import { peticion } from "@/lib/api";

// Busca por cédula, teléfono, correo o nombre.
// encodeURIComponent: si escriben "María López" el espacio y la tilde viajan bien en la URL
export function buscarPropietarios(texto) {
  return peticion(`/clinica/propietarios/buscar?q=${encodeURIComponent(texto)}`);
}

// Mascotas activas de un propietario
export function obtenerMascotasDePropietario(propietarioId) {
  return peticion(`/clinica/propietarios/${propietarioId}/mascotas`);
}