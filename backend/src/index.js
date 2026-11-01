
// como lo colocamos en router aca solo dejamos el encendido

import { app } from "./app.js";

const puerto = process.env.PORT || 4000;
app.listen(puerto, () => {
  console.log(`Servidor escuchando en http://localhost:${puerto}`);
});
