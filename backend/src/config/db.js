import fs from "node:fs"; // Importamos el módulo nativo del sistema de archivos de Node.js
import mysql from "mysql2/promise"; // para usar asyc/await 

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { ca: fs.readFileSync(process.env.DB_CA_PATH) },
  waitForConnections: true,
  connectionLimit: 10,
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true,
  decimalNumbers: true,
});