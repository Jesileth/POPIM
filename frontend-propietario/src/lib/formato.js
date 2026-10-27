const DIAS_ORDEN = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"];
const DIAS_ABREVIADOS = {
  LUNES: "Lun",
  MARTES: "Mar",
  MIERCOLES: "Mié",
  JUEVES: "Jue",
  VIERNES: "Vie",
  SABADO: "Sáb",
  DOMINGO: "Dom",
};

// La API entrega la edad actual en meses (vista v_mascotas.edad_actual_meses)
export function formatearEdad(meses) {
  if (meses === null || meses === undefined) return "";
  if (meses < 1) return "Menos de 1 mes";
  if (meses < 12) return `${meses} ${meses === 1 ? "mes" : "meses"}`;
  const anios = Math.floor(meses / 12);
  const resto = meses % 12;
  const textoAnios = `${anios} ${anios === 1 ? "año" : "años"}`;
  return resto === 0 ? textoAnios : `${textoAnios} y ${resto} ${resto === 1 ? "mes" : "meses"}`;
}

// "2026-11-03" → "mar, 3 nov 2026"
export function formatearFecha(fecha) {
  return new Intl.DateTimeFormat("es", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${fecha}T00:00:00`));
}

// "14:00" o "14:00:00" → "2:00 PM"
export function formatearHora(hora) {
  const [h, m] = hora.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

// Fecha de hoy como "AAAA-MM-DD" (hora local, no UTC)
export function hoyISO() {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");
  return `${hoy.getFullYear()}-${mes}-${dia}`;
}

// Ahora como "AAAA-MM-DDTHH:MM" para comparar con fecha + hora de una cita
export function ahoraISO() {
  const ahora = new Date();
  const hora = String(ahora.getHours()).padStart(2, "0");
  const minutos = String(ahora.getMinutes()).padStart(2, "0");
  return `${hoyISO()}T${hora}:${minutos}`;
}

export function iniciales(nombre = "") {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((palabra) => palabra[0]?.toUpperCase() ?? "")
    .join("");
}

// Horarios_personal → "Lun–Vie 08:00–16:00"
export function resumirHorario(horarios = []) {
  const grupos = new Map();
  for (const h of horarios) {
    const rango = `${h.horaInicio.slice(0, 5)}–${h.horaFin.slice(0, 5)}`;
    grupos.set(rango, [...(grupos.get(rango) ?? []), DIAS_ORDEN.indexOf(h.diaSemana)]);
  }
  return [...grupos]
    .map(([rango, indices]) => {
      const dias = [...indices].sort((a, b) => a - b);
      const seguidos = dias.length > 1 && dias.every((d, i) => i === 0 || d === dias[i - 1] + 1);
      const texto = seguidos
        ? `${DIAS_ABREVIADOS[DIAS_ORDEN[dias[0]]]}–${DIAS_ABREVIADOS[DIAS_ORDEN[dias[dias.length - 1]]]}`
        : dias.map((d) => DIAS_ABREVIADOS[DIAS_ORDEN[d]]).join(", ");
      return `${texto} ${rango}`;
    })
    .join(" · ");
}