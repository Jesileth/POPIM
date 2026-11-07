const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const fmt = (fecha, o) => new Intl.DateTimeFormat("es", o).format(new Date(`${fecha}T00:00:00`));
const dos = (n) => String(n).padStart(2, "0");

export function hoyISO() {
  const h = new Date();
  return `${h.getFullYear()}-${dos(h.getMonth() + 1)}-${dos(h.getDate())}`;
}
export function sumarDias(fecha, dias) {
  const r = new Date(`${fecha}T00:00:00`);
  r.setDate(r.getDate() + dias);
  return `${r.getFullYear()}-${dos(r.getMonth() + 1)}-${dos(r.getDate())}`;
}
export const horaAhora = () => {
  const h = new Date();
  return `${dos(h.getHours())}:${dos(h.getMinutes())}`;
};
export const ahoraISO = () => `${hoyISO()}T${horaAhora()}`;

// "Martes 3 de noviembre"
export const fechaLarga = (f) => cap(fmt(f, { weekday: "long", day: "numeric", month: "long" }).replace(",", ""));
// "Martes, 3 de noviembre de 2026"
export const fechaCompleta = (f) => cap(fmt(f, { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
// "Mar 3 nov"
export const fechaCorta = (f) => cap(fmt(f, { weekday: "short", day: "numeric", month: "short" }).replace(",", "").replace(".", ""));
// "3 nov 2026"
export const fechaDia = (f) => fmt(f, { day: "numeric", month: "short", year: "numeric" }).replace(/\./g, "");

export const diaRelativo = (f) => (f === hoyISO() ? "Hoy" : fechaCorta(f));

// "2026-11-02T15:20" -> "Pedida ayer 15:20"
export function pedida(iso) {
  const f = iso.slice(0, 10);
  const dia = f === hoyISO() ? "hoy" : f === sumarDias(hoyISO(), -1) ? "ayer" : fechaCorta(f).toLowerCase();
  return `Pedida ${dia} ${iso.slice(11, 16)}`;
}
// "lunes 2 de noviembre a las 15:20"
export const fechaLargaHora = (iso) => `${fechaLarga(iso.slice(0, 10)).toLowerCase()} a las ${iso.slice(11, 16)}`;
// "2 nov, 15:20"
export const fechaHoraCorta = (iso) =>
  `${fmt(iso.slice(0, 10), { day: "numeric", month: "short" }).replace(".", "")}, ${iso.slice(11, 16)}`;

export function formatearEdad(meses) {
  if (meses === null || meses === undefined) return "";
  if (meses < 1) return "Menos de 1 mes";
  if (meses < 12) return `${meses} ${meses === 1 ? "mes" : "meses"}`;
  const a = Math.floor(meses / 12);
  const r = meses % 12;
  const t = `${a} ${a === 1 ? "año" : "años"}`;
  return r === 0 ? t : `${t} y ${r} ${r === 1 ? "mes" : "meses"}`;
}

// "Dra. Ana Morales" -> "AM" (ignora los títulos)
export const iniciales = (nombre = "") =>
  nombre.trim().split(/\s+/).filter((p) => !p.endsWith(".")).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");

// "11:00" -> "12:00" (fin del bloque de 60 min)
export const sig = (h) => `${String(Number(h.slice(0, 2)) + 1).padStart(2, "0")}:00`;
