/* Los post de las rutas */

import { peticion } from "@/lib/api";

const post = (ruta) => (cuerpo) => peticion(ruta, { metodo: "POST", cuerpo });

export const registrarPropietario = (datos) =>
  peticion("/auth/registro", {
    metodo: "POST",
    cuerpo: {
      nombreCompleto: datos.nombre,
      correo: datos.email,
      telefono: datos.telefono,
      cedula: datos.cedula,
      contrasena: datos.password,
    },
  });

export const iniciarSesion = (datos) =>
  peticion("/auth/login", {
    metodo: "POST",
    cuerpo: {
      identificador: datos.identificador ?? datos.email,
      contrasena: datos.password,
      portal: "PROPIETARIO",
      recordarme: Boolean(datos.recordarme),
    },
  });


export const buscarPerfilPendiente = post("/auth/activacion/buscar");
export const activarCuenta = post("/auth/activacion/confirmar");
export const solicitarCodigo = post("/auth/recuperacion/solicitar");
export const verificarCodigo = post("/auth/recuperacion/verificar");
export const restablecerPassword = post("/auth/recuperacion/restablecer");