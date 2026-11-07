// TEMPORAL (de tu compañero): lee del mock en memoria lib/mockClinica.js. Cuando exista el backend se cambia por peticion().
import { simular } from "@/lib/simulador";
import * as m from "@/lib/mockClinica";

export const listarMascotas = simular(m.listarMascotas);
export const obtenerMascota = simular(m.obtenerMascota);
export const registrarMascota = simular(m.registrarMascota, 500);
