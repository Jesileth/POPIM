import fs from "node:fs"; // Importamos el módulo nativo del sistema de archivos de Node.js
import mysql from "mysql2/promise"; // para usar asyc/await 

// En Railway el certificado llega como texto en DB_CA; en mi compu, como archivo en DB_CA_PATH.
function opcionesSsl() {
  if (process.env.DB_CA) return { ca: process.env.DB_CA.replace(/\\n/g, "\n") };
  if (process.env.DB_CA_PATH) return { ca: fs.readFileSync(process.env.DB_CA_PATH) };
  return undefined;
}

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
    ssl: opcionesSsl(),
  // ssl: { ca: fs.readFileSync(process.env.DB_CA_PATH) },
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true,
  decimalNumbers: true,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  maxIdle: 5,
  idleTimeout: 10 * 60 * 1000, // mantiene las conexiones abiertas 10 minutos sin uso
});


// Lo que hace es abrir varias conexiones al arrancar, para que la primera petición real no pague los 1.6 s
export async function calentarPool(cantidad = 5) {
  await Promise.all(Array.from({ length: cantidad }, () => pool.query("SELECT 1")));
}