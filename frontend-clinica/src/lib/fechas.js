
// Ayudas para fechas y horas.
// Las fechas van como texto "AAAA-MM-DD" y las horas como "HH:MM:SS",
// igual que las devuelve MySQL con dateStrings: true.

const dos = (n) => String(n).padStart(2, "0");

// Fecha de HOY en hora local.
// OJO: no usamos new Date().toISOString() porque eso da la fecha en UTC:
// en Nicaragua (UTC-6), después de las 6 p. m. ¡ya diría que es mañana!
export function hoyISO() {
  const d = new Date();
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}

// "2026-11-06" + 1 día → "2026-11-07" (también cruza meses y años bien)
export function sumarDias(fechaISO, dias) {
  const [anio, mes, dia] = fechaISO.split("-").map(Number);
  const f = new Date(anio, mes - 1, dia + dias);
  return `${f.getFullYear()}-${dos(f.getMonth() + 1)}-${dos(f.getDate())}`;
}

// "2026-11-06" → "Viernes, 6 de noviembre"
export function fechaLarga(fechaISO) {
  const [anio, mes, dia] = fechaISO.split("-").map(Number);
  const texto = new Date(anio, mes - 1, dia).toLocaleDateString("es-NI", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// "09:30:00" → 570 minutos (más fácil de comparar y sumar)
export function aMinutos(hora) {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

// 570 → "09:30"
export function aHora(minutos) {
  return `${dos(Math.floor(minutos / 60))}:${dos(minutos % 60)}`;
}

// Minutos que van del día de hoy (ej. 14:05 → 845)
export function minutosAhora() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}