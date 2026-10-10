/* Los post de las rutas */

import { peticion } from "@/lib/api";

const post = (ruta) => (cuerpo) => peticion(ruta, { metodo: "POST", cuerpo });

export const iniciarSesion = post("/auth/login");
export const registrarPropietario = post("/auth/registro");
export const buscarPerfilPendiente = post("/auth/activacion/buscar");
export const activarCuenta = post("/auth/activacion/confirmar");
export const solicitarCodigo = post("/auth/recuperacion/solicitar");
export const confirmarRecuperacion = post("/auth/recuperacion/confirmar");