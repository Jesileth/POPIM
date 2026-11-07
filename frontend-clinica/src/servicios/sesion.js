// TEMPORAL (de tu compañero): lee del mock en memoria lib/mockClinica.js. Cuando exista el backend se cambia por peticion().
import { simular } from "@/lib/simulador";
import * as m from "@/lib/mockClinica";

export const obtenerSesion = simular(m.obtenerSesion);
export const cerrarSesion = simular(() => ({}));
export const actualizarPerfil = simular(m.actualizarPerfil);
export const cambiarPassword = simular(m.cambiarPassword);
