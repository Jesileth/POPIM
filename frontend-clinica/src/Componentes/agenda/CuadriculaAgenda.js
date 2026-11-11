

//

import CeldaAgenda from "@/Componentes/agenda/CeldaAgenda";
import { armarCuadricula } from "@/lib/agenda";

// "Dra. Ana Morales" → "AM" (saltándose Dr./Dra.)
function iniciales(nombre = "") {
  return nombre
    .replace(/^Dra?\.\s*/, "")
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export default function CuadriculaAgenda({ agenda, puedeAgendar }) {
  const filas = armarCuadricula(agenda);
  const total = agenda.veterinarios.length;

  if (total === 0 || filas.length === 0) {
    return (
      <div className="rounded-2xl border border-popim-linea bg-white px-6 py-12 text-center text-sm text-popim-texto">
        Ningún veterinario atiende este día.
      </div>
    );
  }

  // La cantidad de columnas depende de cuántos veterinarios haya,
  // por eso va en "style" y no en una clase de Tailwind
  const columnas = { gridTemplateColumns: `76px repeat(${total}, minmax(170px, 1fr))` };

  return (
    <div className="overflow-x-auto rounded-2xl border border-popim-linea bg-white">
      <div style={{ minWidth: 76 + total * 180 }}>
        {/* Encabezado: un veterinario por columna */}
        <div className="grid border-b border-popim-linea" style={columnas}>
          <div />
          {agenda.veterinarios.map((vet) => (
            <div key={vet.personalId} className="flex items-center gap-2.5 border-l border-popim-linea px-3 py-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-popim-panel-oscuro text-xs font-bold text-white">
                {iniciales(vet.nombre)}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-popim-ink">{vet.nombre}</span>
                <span className="block truncate text-xs text-popim-texto">{vet.especialidad}</span>
              </span>
            </div>
          ))}
        </div>

        {/* Una fila por bloque de tiempo */}
        {filas.map((fila) => (
          <div key={fila.hora} className="grid border-b border-popim-linea last:border-b-0" style={columnas}>
            <div className="px-3 py-3 text-[13px] font-bold text-popim-texto">{fila.hora}</div>
            {fila.celdas.map((celda) => (
              <div key={celda.personalId} className="border-l border-popim-linea p-1.5">
                <CeldaAgenda celda={celda} fecha={agenda.fecha} puedeAgendar={puedeAgendar} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}