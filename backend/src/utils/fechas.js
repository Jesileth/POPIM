//

// La base guarda "2026-11-02 03:50:00" en UTC. Con la "Z" el navegador la convierte a hora local.
export const aMomentoUtc = (texto) => (texto ? `${texto.replace(" ", "T")}Z` : null);

// El día de hoy como "AAAA-MM-DD", en la hora del servidor
export function hoyLocal() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

export const DIAS_SEMANA = ["DOMINGO", "LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];

// "08:30" -> 510 (minutos desde la medianoche), para poder sumar y comparar horas
export const aMinutos = (hora) => {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
};

// 510 -> "08:30"
export const deMinutos = (min) =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

export const ahoraEnMinutos = () => {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
};


export const esFechaValida = (f) =>
  /^\d{4}-\d{2}-\d{2}$/.test(f) && !Number.isNaN(new Date(`${f}T00:00:00`).getTime());

export function fechaHoraManagua(fecha = new Date()) {
  return new Intl.DateTimeFormat("es-NI", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Managua",
  }).format(fecha);
}



// La base guarda los momentos en UTC ("2026-11-07 08:56:00").
// Esto lo pasa a la hora de Nicaragua con el formato que usa el portal de la clínica: "2026-11-07T02:56"
export function aLocalManagua(texto) {
  if (!texto) return null;
  const momento = new Date(`${texto.replace(" ", "T")}Z`);
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Managua",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    })
      .formatToParts(momento)
      .map((p) => [p.type, p.value])
  );
  return `${partes.year}-${partes.month}-${partes.day}T${partes.hour}:${partes.minute}`;
}