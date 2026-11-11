
// formato del correo 
const COLORES = {
  azulOscuro: "#1E3A5F",
  azul: "#3E74B3",
  fondo: "#F4F8FC",
  texto: "#334155",
  suave: "#64748B",
};

// Todo dato escrito por una persona (nombre, mascota...) pasa por aquí antes de entrar al HTML,
// para que nadie pueda meter etiquetas dentro de un correo nuestro.
export function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function cajaCodigo(codigo) {
  return `<div style="margin:20px 0;text-align:center;">
    <span style="display:inline-block;background:${COLORES.fondo};border:2px dashed ${COLORES.azul};border-radius:10px;padding:14px 16px 14px 26px;font-family:'Courier New',monospace;font-size:34px;font-weight:bold;letter-spacing:10px;color:${COLORES.azulOscuro};">${escaparHtml(codigo)}</span>
  </div>`;
}

export function nota(textoNota) {
  return `<p style="margin:12px 0 0;font-size:14px;color:${COLORES.suave};">${textoNota}</p>`;
}

export function maquetarCorreo({ titulo, vistaPrevia = "", cuerpoHtml }) {
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escaparHtml(titulo)}</title>
</head>
<body style="margin:0;padding:0;background:${COLORES.fondo};">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escaparHtml(vistaPrevia)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORES.fondo};padding:24px 12px;">
    <tr><td align="center">

      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;">
        <tr><td style="background:${COLORES.azulOscuro};padding:20px 28px;color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:1px;">POPIM</td></tr>
        <tr><td style="padding:28px;color:${COLORES.texto};font-size:16px;line-height:1.6;">
          <h1 style="margin:0 0 16px;font-size:22px;color:${COLORES.azulOscuro};">${escaparHtml(titulo)}</h1>
          ${cuerpoHtml}

        </td></tr>

        <tr><td style="background:#EEF3F9;padding:18px 28px;color:${COLORES.suave};font-size:12px;line-height:1.5;">
          POPIM · Gestión de citas y salud animal<br>
          Managua, Nicaragua · Mensaje automático, no respondas a este correo
        </td></tr>
        
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}