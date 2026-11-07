import { peticion } from "@/lib/api";

export const obtenerEspecies = () => peticion("/catalogos/especies");
export const obtenerRazas = (especieId) => peticion(`/catalogos/especies/${especieId}/razas`);