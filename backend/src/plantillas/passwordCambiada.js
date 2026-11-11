//

import { escaparHtml, maquetarCorreo, nota } from "./base.js";

export function plantillaPasswordCambiada({ nombre, fechaHora }) {
  const asunto = "Tu contraseña de POPIM fue cambiada";

  const html = maquetarCorreo({
    titulo: "Cambiaste tu contraseña",
    vistaPrevia: "Te avisamos que la contraseña de tu cuenta cambió.",
    cuerpoHtml: `
      <p style="margin:0 0 12px;">Hola, ${escaparHtml(nombre)}.</p>
      <p style="margin:0 0 12px;">La contraseña de tu cuenta de POPIM se cambió el <b>${escaparHtml(fechaHora)}</b>.</p>
      ${nota("Si fuiste tú, no tienes que hacer nada más.")}
      ${nota("Si no fuiste tú, restablece tu contraseña de inmediato con la opción de recuperación y avisa a la administración de POPIM.")}`,
  });

  const texto =
    `Hola, ${nombre}.\n\n` +
    `La contraseña de tu cuenta de POPIM se cambió el ${fechaHora}.\n\n` +
    `Si fuiste tú, no tienes que hacer nada más.\n` +
    `Si no fuiste tú, restablece tu contraseña de inmediato con la opción de recuperación y avisa a la administración de POPIM.\n\n` +
    `POPIM · Managua, Nicaragua`;

  return { asunto, html, texto };
}