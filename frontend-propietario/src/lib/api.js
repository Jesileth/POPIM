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

export async function descargarArchivo(ruta, nombreSugerido) {
  let blob;

  if (USAR_MOCK) {
    blob = new Blob(
      ["Archivo de ejemplo del modo de prueba. Con el backend se descargará el archivo real."],
      { type: "text/plain" },
    );
  } else {
    try {
      const respuesta = await fetch(`${API_URL}${ruta}`, { credentials: "include" });
      if (!respuesta.ok) {
        return { ok: false, estado: respuesta.status, error: "No pudimos descargar el archivo. Intenta de nuevo." };
      }
      blob = await respuesta.blob();
    } catch {
      return { ok: false, estado: 0, error: "No pudimos conectar con el servidor. Revisa tu conexión." };
    }
  }

  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = USAR_MOCK ? `${nombreSugerido}.txt` : nombreSugerido;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
  return { ok: true, estado: 200 };
}

// Sube un archivo (foto) con multipart/form-data. En modo de prueba lo simula en el navegador.
export async function subirArchivo(ruta, archivo, campo = "foto") {
  if (USAR_MOCK) return simular(ruta, "POST", { archivo });

  try {
    const formulario = new FormData();
    formulario.append(campo, archivo); // sin Content-Type: el navegador pone el boundary
    const respuesta = await fetch(`${API_URL}${ruta}`, {
      method: "POST",
      credentials: "include",
      body: formulario,
    });
    const datos = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) {
      return {
        ok: false,
        estado: respuesta.status,
        error: datos.mensaje ?? "No pudimos subir el archivo. Intenta de nuevo.",
        campo: datos.campo,
      };
    }
    return { ok: true, estado: respuesta.status, datos };
  } catch {
    return { ok: false, estado: 0, error: "No pudimos conectar con el servidor. Revisa tu conexión." };
  }
}
