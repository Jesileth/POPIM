//

import { transporte, MODO_CORREO } from "../config/correo.js";

// Único punto del sistema que sabe cómo se envía un correo (patrón Adapter)
export async function enviarCorreo({ para, asunto, html, texto }) {
  if (MODO_CORREO !== "smtp") {
    console.log(`\n--- CORREO (modo consola) ---\nPara: ${para}\nAsunto: ${asunto}\n${texto}\n-----------------------------\n`);
    return { simulado: true };
  }
  return transporte.sendMail({ from: process.env.CORREO_REMITENTE, to: para, subject: asunto, html, text: texto });
}