
import { pool } from "../src/config/db.js";

try {
  const [filas] = await pool.query("SELECT DATABASE() AS bd, VERSION() AS version");
  console.log("Conectado:", filas[0]);

  const [roles] = await pool.query("SELECT codigo FROM roles");
  console.log("Roles en la base:", roles.map((r) => r.codigo));
} catch (error) {
  console.error("No conectó:", error.code, error.message);
} finally {
  await pool.end();
}