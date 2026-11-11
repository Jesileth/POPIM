

import { peticion } from "@/lib/api";

// Veterinarios activos de la clínica de la sesión
export function obtenerVeterinarios() {
  return peticion("/clinica/veterinarios");
}

// Para emergencias: quién está libre ahora y quién hasta qué hora está ocupado
export function obtenerDisponiblesAhora() {
  return peticion("/clinica/veterinarios/disponibles-ahora");
}