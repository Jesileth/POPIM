

// Controladores de Usuarios y accesos del Super Administrador

import * as servicio from "../services/superUsuarios.service.js";

// GET /super/usuarios?q=texto&rol=VETERINARIO&estado=BLOQUEADO
export async function listarUsuarios(req, res) {
  res.json(await servicio.listar({ q: req.query.q, rol: req.query.rol, estado: req.query.estado }));
}

export async function desbloquearUsuario(req, res) {
  res.json(await servicio.desbloquear(req.params.id));
}