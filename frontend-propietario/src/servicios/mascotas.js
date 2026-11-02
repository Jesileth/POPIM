import { peticion, subirArchivo } from "@/lib/api";

export const registrarMascota = async ({ foto, ...datos }) => {
  const respuesta = await peticion("/mascotas", { metodo: "POST", cuerpo: datos });
  if (!respuesta.ok || !(foto instanceof File)) return respuesta;

  // La mascota ya existe. Ahora se sube su foto.
  const id = respuesta.datos.mascota.id;
  const subida = await subirArchivo(`/mascotas/${id}/foto`, foto);
  if (subida.ok) respuesta.datos.mascota.fotoUrl = subida.datos.url;
  return respuesta; // si la foto falló, la mascota igual quedó registrada
};

export const listarMascotas = () => peticion("/mascotas");

export const obtenerMascota = (id) => peticion(`/mascotas/${id}`);
export const obtenerCartilla = (id) => peticion(`/mascotas/${id}/cartilla`);
export const listarConsultasMascota = (id) => peticion(`/mascotas/${id}/consultas`);
export const listarExamenesMascota = (id) => peticion(`/mascotas/${id}/examenes`);

export const subirFotoMascota = (id, archivo) =>
  subirArchivo(`/mascotas/${id}/foto`, archivo);

export const quitarFotoMascota = (id) =>
  peticion(`/mascotas/${id}/foto`, { metodo: "DELETE" });