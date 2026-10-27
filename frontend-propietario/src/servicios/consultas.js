import { descargarArchivo, peticion } from "@/lib/api";

export const obtenerConsulta = (id) => peticion(`/consultas/${id}`);

// El archivo se pide al servidor con la sesión: nunca se expone su ruta real
export const descargarExamen = (examen) =>
  descargarArchivo(`/examenes/${examen.id}/archivo`, examen.nombreOriginal);