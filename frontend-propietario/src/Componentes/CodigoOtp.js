// componente para realizar las 6 casillas

"use client";

import { useRef } from "react";

const LARGO = 6;

export default function CodigoOtp({ valor, onChange, error = "", disabled = false }) {
  const casillas = useRef([]);

  function enfocar(indice) {
    const destino = Math.max(0, Math.min(indice, LARGO - 1));
    casillas.current[destino]?.focus();
  }

  function alCambiar(indice, evento) {
    const digitos = evento.target.value.replace(/\D/g, "");

    if (!digitos) {
      // La casilla quedó vacía: se borró ese dígito
      onChange(valor.slice(0, indice) + valor.slice(indice + 1));
      return;
    }
    if (digitos.length > 1) {
      // Varios dígitos de golpe (autocompletado): se reparten desde el inicio
      const completo = digitos.slice(0, LARGO);
      onChange(completo);
      enfocar(completo.length);
      return;
    }
    // Un dígito: va en su casilla o, si hay huecos antes, en la siguiente libre
    const posicion = Math.min(indice, valor.length);
    onChange((valor.slice(0, posicion) + digitos + valor.slice(posicion + 1)).slice(0, LARGO));
    enfocar(posicion + 1);
  }

  function alTeclear(indice, evento) {
    if (evento.key === "Backspace" && !valor[indice] && indice > 0) {
      evento.preventDefault();
      onChange(valor.slice(0, indice - 1) + valor.slice(indice));
      enfocar(indice - 1);
    } else if (evento.key === "ArrowLeft") {
      evento.preventDefault();
      enfocar(indice - 1);
    } else if (evento.key === "ArrowRight") {
      evento.preventDefault();
      enfocar(indice + 1);
    }
  }

  function alPegar(evento) {
    evento.preventDefault();
    const pegado = evento.clipboardData.getData("text").replace(/\D/g, "").slice(0, LARGO);
    if (!pegado) return;
    onChange(pegado);
    enfocar(pegado.length);
  }

  return (
    <div>
      <div
        role="group"
        aria-label="Código de verificación de 6 dígitos"
        className="flex gap-2 sm:gap-3"
      >
        {Array.from({ length: LARGO }, (_, i) => (
          <input
            key={i}
            ref={(elemento) => {
              casillas.current[i] = elemento;
            }}
            value={valor[i] ?? ""}
            onChange={(evento) => alCambiar(i, evento)}
            onKeyDown={(evento) => alTeclear(i, evento)}
            onPaste={alPegar}
            onFocus={(evento) => evento.target.select()}
            onClick={(evento) => evento.target.select()}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={LARGO}
            disabled={disabled}
            aria-label={`Dígito ${i + 1} de ${LARGO}`}
            aria-invalid={error ? "true" : undefined}
            className={`h-12 w-10 rounded-lg border bg-popim-page text-center text-lg font-semibold outline-none focus:ring-2 focus:ring-popim-primary disabled:cursor-not-allowed disabled:opacity-60 sm:h-14 sm:w-12 ${
              error ? "border-red-700" : "border-popim-ink/70"
            }`}
          />
        ))}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
