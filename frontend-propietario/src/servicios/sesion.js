import { peticion } from "@/lib/api";

// → { usuario, menu: [{ id, etiqueta, ruta, icono, orden }], permisos: ["CITAS_VER", ...] }
export const obtenerSesion = () => peticion("/auth/sesion");
export const cerrarSesion = () => peticion("/auth/logout", { metodo: "POST" });
