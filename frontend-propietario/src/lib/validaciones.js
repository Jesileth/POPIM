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
    : "Escribe un correo válido, por ejemplo Prueba@popim.com.";
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

// Da formato mientras se escribe: 001-270109-0000X
export function formatearCedula(valor) {
  const limpio = valor.toUpperCase().replace(/[^0-9A-Z]/g, "");
  const digitos = limpio.slice(0, 13).replace(/\D/g, "");
  // La letra final solo se acepta cuando ya están los 13 dígitos
  const letra = digitos.length === 13 ? limpio.slice(13, 14).replace(/[^A-Z]/g, "") : "";

  const parte1 = digitos.slice(0, 3);
  const parte2 = digitos.slice(3, 9);
  const parte3 = digitos.slice(9, 13) + letra;

  return [parte1, parte2, parte3].filter(Boolean).join("-");
}

//validaciones del correo enmascarado al recuperar contraseña
export function enmascararEmail(email) {
  const [usuario, dominio] = email.split("@");
  if (!dominio) return email;
  return `${usuario.slice(0, 2)}•••@${dominio}`;
}


// Edad en años o en meses, siempre un número entero mayor que 0
export function validarEdad(valor, unidad = "anios") {
  if (valor === undefined || valor === "") return "Escribe la edad de tu mascota.";
  const edad = Number(valor);
   const esMeses = unidad === "MESES";
  const maximo = esMeses ? 480 : 40;
  if (!Number.isInteger(edad) || edad < 1 || edad > maximo) {
    return `Escribe un número entero entre 1 y ${maximo} ${esMeses ? "meses" : "años"}.`;
  }
  return "";
}

// La fecha es opcional: si está vacía no hay error
export function validarFechaNacimiento(valor) {
  if (!valor) return "";
  const fecha = new Date(`${valor}T00:00:00`);
  if (Number.isNaN(fecha.getTime())) return "Escribe una fecha válida.";
  return fecha > new Date() ? "La fecha no puede ser futura." : "";
}

// ---------- Teléfono (8 dígitos, Nicaragua) ----------

// Deja solo los dígitos; si pegan "+505 8888 8888" quita el 505
export function normalizarTelefono(valor) {
  let digitos = valor.replace(/\D/g, "");
  if (digitos.length > 8 && digitos.startsWith("505")) digitos = digitos.slice(3);
  return digitos.slice(0, 8);
}

// Da formato mientras se escribe: 8888-8888
export function formatearTelefono(valor) {
  const digitos = normalizarTelefono(valor);
  return digitos.length > 4 ? `${digitos.slice(0, 4)}-${digitos.slice(4)}` : digitos;
}

export function validarTelefono(valor) {
  if (!valor || !valor.trim()) return "Escribe tu número de teléfono.";
  return /^[2578]\d{7}$/.test(normalizarTelefono(valor))
    ? ""
    : "El teléfono debe tener 8 dígitos, por ejemplo 8888-8888.";
}

// ---------- Login: correo o teléfono en el mismo campo ----------

export function validarIdentificadorLogin(valor) {
  if (!valor || !valor.trim()) return "Escribe tu correo o tu teléfono.";
  return valor.includes("@") ? validarEmail(valor) : validarTelefono(valor);
}

export function normalizarIdentificadorLogin(valor) {
  return valor.includes("@") ? normalizarEmail(valor) : normalizarTelefono(valor);
}

// ---------- Imágenes (foto de perfil y de mascota) ----------
export const TIPOS_IMAGEN = ["image/jpeg", "image/png", "image/webp"];
export const MAX_IMAGEN_MB = 2;

export function validarImagen(archivo) {
  if (!TIPOS_IMAGEN.includes(archivo.type)) return "Usa una imagen JPG, PNG o WebP.";
  if (archivo.size > MAX_IMAGEN_MB * 1024 * 1024) {
    return `La imagen no puede pesar más de ${MAX_IMAGEN_MB} MB.`;
  }
  return "";
}