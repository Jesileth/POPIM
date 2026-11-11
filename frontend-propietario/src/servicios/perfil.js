import { peticion, subirArchivo } from "@/lib/api";

export const obtenerPerfil = () => peticion("/perfil");
export const guardarPerfil = (cuerpo) => peticion("/perfil", { metodo: "PUT", cuerpo });
export const subirFotoPerfil = (archivo) => subirArchivo("/perfil/foto", archivo);
export const quitarFotoPerfil = () => peticion("/perfil/foto", { metodo: "DELETE" });
export const cambiarPassword = (cuerpo) => peticion("/perfil/password", { metodo: "POST", cuerpo });
