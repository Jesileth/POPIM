
// Mi perfil (recepcionista, veterinario y demás personal).
// Ya usa peticion(): son las MISMAS rutas del portal del propietario (GET/PUT /perfil y
// POST /perfil/password). El backend sabe de quién es el perfil por la cookie de sesión.
// Mientras NEXT_PUBLIC_USAR_MOCK no sea "false", las responde lib/mock.js.
import { peticion, subirArchivo } from "@/lib/api";

// → { usuario, clinica, horario }   (horario solo viene si es veterinario)
export const obtenerPerfil = () => peticion("/perfil");

export const actualizarPerfil = (datos) => peticion("/perfil", { metodo: "PUT", cuerpo: datos });

// El backend espera passwordActual y passwordNueva (igual que en el portal del propietario)
export const cambiarPassword = ({ actual, nueva }) =>
  peticion("/perfil/password", { metodo: "POST", cuerpo: { passwordActual: actual, passwordNueva: nueva } });

// archivo = el File elegido en el <input type="file">; viaja en el campo "foto" → { url }
export const subirFotoPerfil = (archivo) => subirArchivo("/perfil/foto", archivo);

export const quitarFotoPerfil = () => peticion("/perfil/foto", { metodo: "DELETE" });


/*
// TEMPORAL lee del mock en memoria lib/mockClinica.js. Cuando exista el backend se cambia por peticion().
import { simular } from "@/lib/simulador";
import * as m from "@/lib/mockClinica";

export const obtenerSesion = simular(m.obtenerSesion);
export const cerrarSesion = simular(() => ({}));
export const actualizarPerfil = simular(m.actualizarPerfil);
export const cambiarPassword = simular(m.cambiarPassword);

*/
