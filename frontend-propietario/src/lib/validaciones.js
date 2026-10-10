/* !!! Estas son las validaciones de los formularios jaj */

export const MIN_PASSWORD = 8; // minimo de digitos de la contraseña

export const normalizarEmail = (valor) => valor.trim().toLowerCase();
export const normalizarCedula = (valor) => valor.replace(/[\s-]/g, "").toUpperCase();

export function validarObligatorio(valor, mensaje = "Este campo es obligatorio.") {
  return valor && valor.trim() ? "" : mensaje;
}

export function validarEmail(valor) {
  if (!valor || !valor.trim()) return "Escribe tu correo electrónico.";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim())
    ? ""
    : "Escribe un correo válido, por ejemplo nombre@popim.com.";
}

// Validando la cédula en Formato nicaragüense: 3 dígitos + 6 dígitos + 4 dígitos + 1 letra (001-010190-0001A)
export function validarCedula(valor) {
  if (!valor || !valor.trim()) return "Escribe tu cédula de identidad.";
  return /^\d{13}[A-Z]$/.test(normalizarCedula(valor))
    ? ""
    : "La cédula debe verse así: 001-010190-0001A.";
}

export function validarPassword(valor) {
  if (!valor) return "Escribe una contraseña.";
  return valor.length >= MIN_PASSWORD
    ? ""
    : `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`; //mandamos a llamar a la constante
}

export function validarConfirmacion(password, confirmar) {
  if (!confirmar) return "Confirma tu contraseña.";
  return password === confirmar ? "" : "Las contraseñas no coinciden.";
}

export function validarCodigo(valor) {
  return /^\d{6}$/.test((valor ?? "").trim()) ? "" : "El código tiene 6 dígitos.";
}