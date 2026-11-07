/* !! Estas son las respuestas falsas, esto se borra cuando el backend este listo */
/* !! lee esto joaquin*/
import { ESPECIES_MOCK, RAZAS_MOCK } from "@/lib/mockCatalogos";
import { simularPortal } from "@/lib/mockPortal";

const esperar = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

export async function simular(ruta, metodo, cuerpo) {
  await esperar(700); // simula el tiempo de respuesta del servidor

  // Mascotas, citas, perfil, consultas...: viven en mockPortal.js
  const respuestaPortal = await simularPortal(ruta, metodo, cuerpo);
  if (respuestaPortal) return respuestaPortal;

  // ----- Catálogos -----
  if (ruta === "/catalogos/especies") {
    return { ok: true, estado: 200, datos: { especies: ESPECIES_MOCK } };
  }

  const coincidencia = ruta.match(/^\/catalogos\/especies\/(\d+)\/razas$/);
  if (coincidencia) {
    const especieId = Number(coincidencia[1]);
    const nombres = RAZAS_MOCK[especieId] ?? [];
    return {
      ok: true,
      estado: 200,
      // El id de cada raza es: especie * 100 + posición (101, 102, 201...)
      datos: { razas: nombres.map((nombre, indice) => ({ id: especieId * 100 + indice + 1, nombre })) },
    };
  }

  // ----- Acceso y cuentas -----
  switch (ruta) {
    case "/auth/login":
      if (cuerpo.identificador === "error@popim.com") {
        return { ok: false, estado: 401, error: "Correo o contraseña incorrectos." };
      }
      return { ok: true, estado: 200, datos: { usuario: { id: "1", nombre: "Propietario de prueba", rol: "propietario" } } };

    case "/auth/registro":
      if (cuerpo.email === "repetido@popim.com") {
        return { ok: false, estado: 409, campo: "email", error: "Este correo ya está registrado." };
      }
      if (cuerpo.telefono === "88888888") {
        return { ok: false, estado: 409, campo: "telefono", error: "Este teléfono ya está registrado." };
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

    case "/auth/recuperacion/verificar":
      if (cuerpo.codigo !== "123456") {
        return { ok: false, estado: 400, error: "El código es incorrecto o ya expiró." };
      }
      return { ok: true, estado: 200, datos: { tokenRestablecimiento: "token-de-prueba" } };

    case "/auth/recuperacion/restablecer":
      return { ok: true, estado: 200, datos: {} };

    default:
      return { ok: false, estado: 404, error: "Ruta no encontrada." };
  }
}