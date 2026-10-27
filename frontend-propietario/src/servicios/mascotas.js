// Regsitro de mascota 

import { peticion } from "@/lib/api";

export const registrarMascota = (cuerpo) =>
  peticion("/mascotas", { metodo: "POST", cuerpo });

export const listarMascotas = () => peticion("/mascotas");