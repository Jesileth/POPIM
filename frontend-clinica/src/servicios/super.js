//

import { peticion } from "@/lib/api";

// ---------- Clínicas (Super Administrador) ----------

// filtros = { q: "texto", estado: "ACTIVAS" | "INACTIVAS" | "" }
// URLSearchParams arma "?q=...&estado=..." y codifica tildes y espacios
export function listarClinicas({ q = "", estado = "" } = {}) {
  const parametros = new URLSearchParams();
  if (q.trim()) parametros.set("q", q.trim());
  if (estado) parametros.set("estado", estado);
  const texto = parametros.toString();
  return peticion(`/super/clinicas${texto ? `?${texto}` : ""}`);
}

export const obtenerClinica = (id) => peticion(`/super/clinicas/${id}`);
export const registrarClinica = (datos) => peticion("/super/clinicas", { metodo: "POST", cuerpo: datos });
export const actualizarClinica = (id, datos) => peticion(`/super/clinicas/${id}`, { metodo: "PUT", cuerpo: datos });
export const cambiarEstadoClinica = (id, activa) =>
  peticion(`/super/clinicas/${id}/estado`, { metodo: "PATCH", cuerpo: { activa } });

export const asignarAdministrador = (id, datos) =>
  peticion(`/super/clinicas/${id}/administrador`, { metodo: "POST", cuerpo: datos });



// ---------- Usuarios y accesos ----------

// filtros = { q: "texto", rol: "VETERINARIO", estado: "BLOQUEADO" } (todos opcionales)
export function listarUsuarios({ q = "", rol = "", estado = "" } = {}) {
  const parametros = new URLSearchParams();
  if (q.trim()) parametros.set("q", q.trim());
  if (rol) parametros.set("rol", rol);
  if (estado) parametros.set("estado", estado);
  const texto = parametros.toString();
  return peticion(`/super/usuarios${texto ? `?${texto}` : ""}`);
}

export const desbloquearUsuario = (id) => peticion(`/super/usuarios/${id}/desbloquear`, { metodo: "POST" });