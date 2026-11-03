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