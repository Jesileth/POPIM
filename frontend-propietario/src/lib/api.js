import { simular } from "@/lib/mock";

// Dirección base del backend. Si el backend vive dentro de Next.js, es "/api".
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

// Mientras no empezemos el backend, todo se simula. Se apaga con NEXT_PUBLIC_USAR_MOCK=false
const USAR_MOCK = process.env.NEXT_PUBLIC_USAR_MOCK !== "false";

/**
 * Todas las peticiones del frontend pasan por aquí y devuelven SIEMPRE la misma forma:
 *   { ok: true,  estado, datos }
 *   { ok: false, estado, error, campo? }   ← "campo" indica qué input falló (ej. "email")
 */
export async function peticion(ruta, { metodo = "GET", cuerpo } = {}) {
  if (USAR_MOCK) return simular(ruta, metodo, cuerpo);

   try {
    const respuesta = await fetch(`${API_URL}${ruta}`, {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      credentials: "include", // envía la cookie de sesión
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    });

    const datos = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
      return {
        ok: false,
        estado: respuesta.status,
        error: datos.mensaje ?? "Ocurrió un error. Intenta de nuevo.",
        campo: datos.campo,
      };
    }
    return { ok: true, estado: respuesta.status, datos };
  } catch {
    return {
      ok: false,
      estado: 0,
      error: "No pudimos conectar con el servidor. Revisa tu conexión.",
    };
  }
}