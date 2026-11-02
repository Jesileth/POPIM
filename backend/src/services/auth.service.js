// los servicios son las reglas
// decide que hacer y lanza errores


import bcrypt from "bcryptjs";
import { ErrorHttp } from "../utils/errores.js";
import * as usuariosRepo from "../repositories/usuarios.repository.js";

export async function registrarPropietario(datos) {
    // encriptamos la contraseña antes de guardarla en la bd
  const contrasenaHash = await bcrypt.hash(datos.contrasena, 12);

  try {
    const id = await usuariosRepo.crearPropietario({
      nombreCompleto: datos.nombreCompleto,
      correo: datos.correo,
      telefono: datos.telefono,
      cedula: datos.cedula,
      direccion: datos.direccion,
      contrasenaHash,
    });
    return { id };
  } 
  
  catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      const m = error.sqlMessage || "";
      if (m.includes("uq_usuarios_correo")) throw new ErrorHttp(409, "Este correo ya está registrado", "correo");
      if (m.includes("uq_usuarios_telefono")) throw new ErrorHttp(409, "Este teléfono ya está registrado", "telefono");
      if (m.includes("uq_prop_cedula")) throw new ErrorHttp(409, "Esta cédula ya está registrada", "cedula");
      throw new ErrorHttp(409, "Ya existe un registro con esos datos");
    }
    throw error;
  }
}