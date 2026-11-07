

// Lo usaremos en todas las rutas /clinica/..., justo después de autenticar.

// Va DESPUÉS de autenticar: averigua en qué clínica trabaja quien inició sesión.
// Así ninguna ruta del portal de la clínica confía en un clinicaId que mande el navegador.

import { ErrorHttp } from "../utils/errores.js";
import * as personalRepo from "../repositories/personal.repository.js";

export async function cargarPersonal(req, res, next) {
  if (req.portal !== "CLINICA") throw new ErrorHttp(403, "Esta opción es del portal de la clínica");

  const vinculo = await personalRepo.buscarVinculo(req.usuarioId);
  if (!vinculo) throw new ErrorHttp(403, "Tu cuenta no está vinculada a una clínica activa");

  // A partir de aquí, cualquier controlador puede usar req.personal
  req.personal = {
    id: vinculo.personalId,        // personal_clinica.id (es el veterinario_id de las citas)
    clinicaId: vinculo.clinicaId,
    rol: vinculo.rol,              // RECEPCIONISTA, VETERINARIO, ADMINISTRADOR
  };
  next();
}