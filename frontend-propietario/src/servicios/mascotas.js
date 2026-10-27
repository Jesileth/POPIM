// Regsitro de mascota 

import { peticion } from "@/lib/api";

export const registrarMascota = (cuerpo) =>
  peticion("/mascotas", { metodo: "POST", cuerpo });

export const listarMascotas = () => peticion("/mascotas");


export const obtenerMascota = (id) => peticion(`/mascotas/${id}`);
export const obtenerCartilla = (id) => peticion(`/mascotas/${id}/cartilla`);
export const listarConsultasMascota = (id) => peticion(`/mascotas/${id}/consultas`);
export const listarExamenesMascota = (id) => peticion(`/mascotas/${id}/examenes`);