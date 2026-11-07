import { peticion } from "@/lib/api";

export const listarMascotas = () => peticion("/clinica/mascotas");
export const obtenerMascota = (id) => peticion(`/clinica/mascotas/${id}`);
// La mascota se registra "dentro" de su propietario
export const registrarMascota = (propietarioId, datos) =>
  peticion(`/clinica/propietarios/${propietarioId}/mascotas`, { metodo: "POST", cuerpo: datos });