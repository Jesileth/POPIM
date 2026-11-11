// configuración del correo con nodemailer

import nodemailer from "nodemailer";

export const MODO_CORREO = process.env.CORREO_MODO ?? "consola";

export const transporte =
  MODO_CORREO === "smtp"
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      })
    : null;