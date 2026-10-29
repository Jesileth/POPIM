import { peticion, subirArchivo } from "@/lib/api";

export const listarMascotas = () => peticion("/mascotas");

// "cuerpo" puede traer la foto en el campo "foto" (en modo de prueba se guarda en el navegador)
export const registrarMascota = (cuerpo) => peticion("/mascotas", { metodo: "POST", cuerpo });

export const obtenerMascota = (id) => peticion(`/mascotas/${id}`);
export const obtenerCartilla = (id) => peticion(`/mascotas/${id}/cartilla`);
export const listarConsultasMascota = (id) => peticion(`/mascotas/${id}/consultas`);
export const listarExamenesMascota = (id) => peticion(`/mascotas/${id}/examenes`);

export const subirFotoMascota = (id, archivo) => subirArchivo(`/mascotas/${id}/foto`, archivo);
export const quitarFotoMascota = (id) => peticion(`/mascotas/${id}/foto`, { metodo: "DELETE" });