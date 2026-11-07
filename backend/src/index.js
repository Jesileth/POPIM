
// como lo colocamos en router aca solo dejamos el encendido

import { app } from "./app.js";
import { calentarPool } from "./config/db.js";

//#region 
/*

const puerto = process.env.PORT || 4000;
app.listen(puerto, () => {
  console.log(`Servidor escuchando en http://localhost:${puerto}`);
});

*/
//#endregion

const puerto = process.env.PORT || 4000;
app.listen(puerto, async () => {
  console.log(`Servidor escuchando en http://localhost:${puerto}`);
  try {
    await calentarPool();
    console.log("Conexiones a la base de datos listas");
  } catch (error) {
    console.error("No se pudo conectar a la base de datos:", error.code || error.message);
  }
});