
import { escaparHtml, maquetarCorreo, cajaCodigo, nota } from "./base.js";

export function plantillaRecuperacion({ nombre, codigo, minutos = 15 }) {
  const asunto = "Tu código para restablecer tu contraseña";

  const html = maquetarCorreo({
    titulo: "Restablece tu contraseña",
    vistaPrevia: `Tu código es ${codigo}. Vence en ${minutos} minutos.`,
    cuerpoHtml: `
      <p style="margin:0 0 12px;">Hola, ${escaparHtml(nombre)}.</p>
      <p style="margin:0 0 12px;">Recibimos una solicitud para restablecer la contraseña de tu cuenta. Usa este código:</p>
      ${cajaCodigo(codigo)}
      ${nota(`Vence en ${minutos} minutos y solo se puede usar una vez.`)}
      ${nota("Si no fuiste tú, ignora este mensaje: tu contraseña no cambiará.")}`,
  });

  // Versión sin diseño, para programas de correo que no muestran HTML
  const texto =
    `Hola, ${nombre}.\n\n` +
    `Tu código para restablecer la contraseña de POPIM es: ${codigo}\n` +
    `Vence en ${minutos} minutos y solo se puede usar una vez.\n\n` +
    `Si no fuiste tú, ignora este mensaje.\n\n` +
    `POPIM · Managua, Nicaragua`;

  return { asunto, html, texto };
}