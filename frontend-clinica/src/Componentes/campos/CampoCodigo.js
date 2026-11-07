//

"use client";

// Código de 6 dígitos en 6 cajitas (como en el portal de propietarios).
//
// Cómo funciona:
//  - Cada cajita guarda UN número. El código completo vive en el padre (prop "valor").
//  - Al escribir, el foco salta solo a la siguiente cajita.
//  - Borrar (Backspace) en una cajita vacía regresa a la anterior.
//  - Si pegan "123456" (Ctrl+V) se llenan las 6 de una vez.
//  - Las flechas ← → mueven el foco.
//
// useRef: guardamos las 6 cajitas en una lista para poder darles foco con .focus().

import { useRef } from "react";

const LARGO = 6;

export default function CampoCodigo({
  id = "codigo",
  etiqueta = "Código de verificación",
  valor, // texto con los dígitos escritos, ej. "12" o "123456"
  alCambiar, // función que recibe el código nuevo
  error = "",
  disabled = false,
}) {
  const cajitas = useRef([]);
  const idError = `${id}-error`;

  // Convierte cualquier texto en solo dígitos, máximo 6
  const limpiar = (texto) => texto.replace(/\D/g, "").slice(0, LARGO);

  function enfocar(posicion) {
    const cajita = cajitas.current[Math.max(0, Math.min(posicion, LARGO - 1))];
    cajita?.focus();
    cajita?.select();
  }

  function alEscribir(posicion, texto) {
    const digito = limpiar(texto).slice(-1); // el último número que escribió
    if (!digito) return;
    // Ponemos el dígito en su posición. Si tocó una cajita más adelante de las llenas,
    // join("") junta los huecos y el número queda en la primera cajita libre.
    const lista = valor.split("");
    lista[posicion] = digito;
    const nuevo = lista.join("");
    alCambiar(nuevo);
    enfocar(Math.min(posicion + 1, nuevo.length));
  }

  function alTeclear(posicion, evento) {
    if (evento.key === "Backspace") {
      evento.preventDefault();
      const lista = valor.split("");
      if (lista[posicion]) {
        // Borra el dígito de esta cajita
        lista.splice(posicion, 1);
        alCambiar(lista.join(""));
      } else if (posicion > 0) {
        // Ya estaba vacía: borra el anterior y regresa
        lista.splice(posicion - 1, 1);
        alCambiar(lista.join(""));
        enfocar(posicion - 1);
      }
    }
    if (evento.key === "ArrowLeft") enfocar(posicion - 1);
    if (evento.key === "ArrowRight") enfocar(posicion + 1);
  }

  function alPegar(evento) {
    evento.preventDefault();
    const pegado = limpiar(evento.clipboardData.getData("text"));
    if (!pegado) return;
    alCambiar(pegado);
    enfocar(pegado.length);
  }

  return (
    <div>
      <label htmlFor={`${id}-0`} className="mb-1.5 block text-sm font-semibold text-popim-ink">
        {etiqueta}
      </label>

      <div className="flex gap-2 sm:gap-3" onPaste={alPegar}>
        {Array.from({ length: LARGO }, (_, posicion) => (
          <input
            key={posicion}
            id={`${id}-${posicion}`}
            ref={(elemento) => (cajitas.current[posicion] = elemento)}
            value={valor[posicion] ?? ""}
            onChange={(evento) => alEscribir(posicion, evento.target.value)}
            onKeyDown={(evento) => alTeclear(posicion, evento)}
            onFocus={(evento) => evento.target.select()}
            inputMode="numeric"
            autoComplete={posicion === 0 ? "one-time-code" : "off"}
            maxLength={2}
            disabled={disabled}
            aria-label={`Dígito ${posicion + 1} de ${LARGO}`}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={error ? idError : undefined}
            className={`h-14 w-full min-w-0 rounded-xl border bg-popim-campo text-center text-xl font-bold text-popim-ink outline-none transition focus:border-popim-primary focus:bg-white focus:ring-4 focus:ring-popim-primary/15 disabled:opacity-60 ${
              error ? "border-red-700" : "border-popim-linea"
            }`}
          />
        ))}
      </div>

      {error && (
        <p id={idError} role="alert" className="mt-1 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}