import { maquetarCorreo, cajaCodigo, nota, escaparHtml } from "./base.js";

/**
 * Genera la plantilla del correo de activación de cuenta en POPIM.
 * 
 * @param {Object} params
 * @param {string} params.nombre - Nombre del usuario registrado
 * @param {string} params.codigo - Código OTP de verificación/activación
 * @returns {{ asunto: string, html: string, texto: string }}
 */
export function plantillaActivacion({ nombre, codigo }) {
  const nombreLimpio = escaparHtml(nombre);
  
  const asunto = "Activa tu cuenta en POPIM";
  const titulo = "Activa tu cuenta";
  const vistaPrevia = `Tu código de activación para POPIM es: ${codigo}`;

  // Versión HTML del correo
  const cuerpoHtml = `
    <p style="margin: 0 0 16px;">Hola, <strong>${nombreLimpio}</strong>.</p>
    <p style="margin: 0 0 16px;">Gracias por registrarte en POPIM. Para activar tu cuenta, ingresa este código:</p>
    ${cajaCodigo(codigo)}
    ${nota("Si no creaste una cuenta en POPIM, ignora este mensaje.")}
  `;

  const html = maquetarCorreo({
    titulo,
    vistaPrevia,
    cuerpoHtml,
  });

  // Versión de texto plano (para clientes de correo que no aceptan HTML)
  const texto = `Hola ${nombre},

Gracias por registrarte en POPIM. Para activar tu cuenta, ingresa este código:

${codigo}

Si no creaste una cuenta en POPIM, ignora este mensaje.

---
POPIM · Gestión de citas y salud animal
Managua, Nicaragua`;

  return {
    asunto,
    html,
    texto,
  };
}