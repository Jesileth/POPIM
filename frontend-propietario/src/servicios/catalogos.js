import { peticion } from "@/lib/api";

// GET /api/catalogos/especies → { especies: [{ id, nombre }] }
export const obtenerEspecies = () => peticion("/catalogos/especies");

// GET /api/catalogos/especies/:id/razas → { razas: [{ id, nombre }] }
export const obtenerRazas = (especieId) =>
  peticion(`/catalogos/especies/${especieId}/razas`);