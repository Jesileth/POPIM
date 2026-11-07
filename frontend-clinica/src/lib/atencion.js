// Reglas de "Atención de hoy" que se usan en varias pantallas del veterinario
// (Atención de hoy, Mi agenda y el numerito rojo del menú). Sin nada de HTML.
import { hoyISO } from "@/lib/fechas";

// Dirección de la pantalla de una consulta
export const rutaConsulta = (consultaId) => `/atencion/consulta/${consultaId}`;

// Separa las citas de hoy en los cuatro grupos de la pantalla
export function agruparAtencion(citas = []) {
  const sinConsulta = citas.filter((c) => !c.consulta);
  return {
    // Emergencias que recepción registró y que el veterinario aún no abre
    emergencias: sinConsulta.filter((c) => c.esEmergencia),
    // Consultas abiertas (cita 503 con consulta sin finalizar)
    enConsulta: citas.filter((c) => c.consulta && !c.consulta.finalizada),
    // Citas normales que faltan: confirmadas (502) y por confirmar (501), ya vienen por hora
    proximas: sinConsulta.filter((c) => !c.esEmergencia && [501, 502].includes(c.estadoId)),
    atendidas: citas.filter((c) => c.consulta?.finalizada),
  };
}

// ["diagnóstico", "receta"] → "diagnóstico y receta" · ["a", "b", "c"] → "a, b y c"
export function listaEnTexto(palabras) {
  if (palabras.length <= 1) return palabras.join("");
  return `${palabras.slice(0, -1).join(", ")} y ${palabras.at(-1)}`;
}

// Qué botón le toca a una cita (sirve en Mi agenda y en Atención de hoy)
export function accionDeCita(cita) {
  if (cita.consulta) {
    return cita.consulta.finalizada
      ? { tipo: "enlace", texto: "Ver consulta", href: rutaConsulta(cita.consulta.id) }
      : { tipo: "enlace", texto: "Continuar consulta", href: rutaConsulta(cita.consulta.id) };
  }
  if (cita.fecha !== hoyISO()) return null; // solo se atiende el mismo día
  if (cita.esEmergencia) return { tipo: "iniciar", texto: "Atender ahora" };
  if (cita.estadoId === 502) return { tipo: "iniciar", texto: "Iniciar consulta" };
  if (cita.estadoId === 501) return { tipo: "nota", texto: "Recepción aún no confirma esta cita." };
  return null;
}
