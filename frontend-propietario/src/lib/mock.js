/* !! Estas son las respuestas falsas, esto se borra cuando el backend este listo */
/* !! lee esto joaquin*/

const esperar = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

export async function simular(ruta, metodo, cuerpo) {
  await esperar(700); // simula el tiempo de respuesta del servidor, solo es un load falso jaja
  
  switch (ruta) {
    case "/auth/login":
      if (cuerpo.email === "error@popim.com") {
        return { ok: false, estado: 401, error: "Correo o contraseña incorrectos." };
      }
      return { ok: true, estado: 200, datos: { usuario: { id: "1", nombre: "Propietario de prueba", rol: "propietario" } } };

    case "/auth/registro":
      if (cuerpo.email === "repetido@popim.com") {
        return { ok: false, estado: 409, campo: "email", error: "Este correo ya está registrado." };
      }
      if (cuerpo.cedula === "0010101900001A") {
        return { ok: false, estado: 409, campo: "cedula", error: "Esta cédula ya está registrada." };
      }
      return { ok: true, estado: 201, datos: {} };

    case "/auth/activacion/buscar":
      if (cuerpo.identificador === "noexiste") {
        return { ok: false, estado: 404, error: "No encontramos un perfil pendiente de activación con esos datos." };
      }
      return { ok: true, estado: 200, datos: { tokenActivacion: "token-de-prueba" } };

    case "/auth/activacion/confirmar":
      return { ok: true, estado: 200, datos: {} };

    case "/auth/recuperacion/solicitar":
      return { ok: true, estado: 200, datos: {} };

    case "/auth/recuperacion/confirmar":
      if (cuerpo.codigo !== "123456") {
        return { ok: false, estado: 400, error: "El código es incorrecto o ya expiró." };
      }
      return { ok: true, estado: 200, datos: {} };

    case "/mascotas":
      return { ok: true, estado: 201, datos: {} };

    default:
      return { ok: false, estado: 404, error: "Ruta no encontrada." };
  }
}
