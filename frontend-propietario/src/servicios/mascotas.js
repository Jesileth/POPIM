// Regsitro de mascota 

import { peticion } from "@/lib/api";

export const registrarMascota = (cuerpo) =>
  peticion("/mascotas", { metodo: "POST", cuerpo });