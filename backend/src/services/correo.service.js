//

import { transporte, MODO_CORREO } from "../config/correo.js";

/* Borramos pq ya no se va a usar consola

// Único punto del sistema que sabe cómo se envía un correo (patrón Adapter)
export async function enviarCorreo({ para, asunto, html, texto }) {
  if (MODO_CORREO !== "smtp") {
    console.log(`\n--- CORREO (modo consola) ---\nPara: ${para}\nAsunto: ${asunto}\n${texto}\n-----------------------------\n`);
    return { simulado: true };
  }
  return transporte.sendMail({ from: process.env.CORREO_REMITENTE, to: para, subject: asunto, html, text: texto });
}

  */

// Único punto del sistema que sabe cómo se envía un correo (patrón Adapter)
export async function enviarCorreo({ para, asunto, html, texto }) {
  // Modo "api": Brevo por HTTPS (en Railway el SMTP está bloqueado)
  if (MODO_CORREO === "api") {
    const respuesta = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: process.env.CORREO_NOMBRE ?? "POPIM", email: process.env.CORREO_REMITENTE_CORREO },
        to: [{ email: para }],
        subject: asunto,
        htmlContent: html,
        textContent: texto,
      }),
    });
    if (!respuesta.ok) throw new Error(`Brevo respondió ${respuesta.status}: ${await respuesta.text()}`);
    return respuesta.json();
  }

  if (MODO_CORREO !== "smtp") {
    console.log(`\n--- CORREO (modo consola) ---\nPara: ${para}\nAsunto: ${asunto}\n${texto}\n-----------------------------\n`);
    return { simulado: true };
  }
  return transporte.sendMail({ from: process.env.CORREO_REMITENTE, to: para, subject: asunto, html, text: texto });
}