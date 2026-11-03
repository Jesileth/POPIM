// Esto es para prueba ya que verifique que dilata bastante en cargar

import { pool } from "../src/config/db.js";

for (let i = 1; i <= 6; i++) {
  const inicio = Date.now();
  await pool.query("SELECT 1");
  console.log(`Consulta ${i}: ${Date.now() - inicio} ms`);
}
await pool.end();