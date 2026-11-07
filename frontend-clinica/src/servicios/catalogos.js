// TEMPORAL (de tu compañero): lee del mock en memoria lib/mockClinica.js. Cuando exista el backend se cambia por peticion().
import { simular } from "@/lib/simulador";
import * as m from "@/lib/mockClinica";

export const obtenerEspecies = simular(m.obtenerEspecies, 150);
export const obtenerRazas = simular(m.obtenerRazas, 150);
