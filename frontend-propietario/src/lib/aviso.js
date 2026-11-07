//

const CLAVE = "popim_aviso";
const VIGENCIA_MS = 10_000; // pasados 10 s, se considera viejo y se ignora

export function guardarAviso(texto) {
  try {
    sessionStorage.setItem(CLAVE, JSON.stringify({ texto, en: Date.now() }));
  } catch {}
}

export function leerAviso() {
  try {
    const guardado = JSON.parse(sessionStorage.getItem(CLAVE));
    if (!guardado || Date.now() - guardado.en > VIGENCIA_MS) return null;
    return guardado.texto;
  } catch {
    return null;
  }
}

export function borrarAviso() {
  try {
    sessionStorage.removeItem(CLAVE);
  } catch {}
}