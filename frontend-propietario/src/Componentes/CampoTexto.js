
"use client";

import { useState } from "react";
import { IconEye, IconEyeSlash, IconIDCard, IconLock, IconMail, IconPerson } from "@/Componentes/Iconos";

const ICONOS = { Iconcorreo: IconMail, candado: IconLock, Identificación: IconIDCard, Persona: IconPerson};

// Aca se definen los props del componente 
export default function CampoTexto({
  id,
  etiqueta,
  tipo = "text",
  placeholder = "",
  autoComplete,
  inputMode,
  maxLength,
  disabled = false,
  error = "",
  formato, // función opcional que arregla el texto mientras se escribe
  icono, // "Iconcorreo" o "candado" (opcional)
  obligatorio = true,
  min,
  max,
}) 
{
  const [visible, setVisible] = useState(false);
  const idError = `${id}-error`;
  const esPassword = tipo === "password";
  const IconoCampo = icono ? ICONOS[icono] : null;

  function alEscribir(evento) {
    evento.target.value = formato(evento.target.value);
  }

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-popim-ink">
        {etiqueta}
      </label>

      <div className="relative">
        {IconoCampo && (
          <IconoCampo
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-popim-etiqueta"
          />
        )}

        <input
          id={id}
          name={id}
          type={esPassword && visible ? "text" : tipo}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          maxLength={maxLength}
          disabled={disabled}
          onChange={formato ? alEscribir : undefined}
          required={obligatorio}
          min={min}
          max={max}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? idError : undefined}
          className={`h-12 w-full rounded-xl border bg-popim-campo text-sm text-popim-ink outline-none transition placeholder:text-popim-placeholder focus:border-popim-primary focus:ring-4 focus:ring-popim-primary/15 disabled:cursor-not-allowed disabled:opacity-60 ${
            IconoCampo ? "pl-11" : "pl-4"
          } ${esPassword ? "pr-12" : "pr-4"} ${
            error ? "border-red-700" : "border-popim-linea"
          }`}
        />

        {esPassword && (
          <button
            type="button"
            onClick={() => setVisible((actual) => !actual)}
            disabled={disabled}
            aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={visible}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-popim-etiqueta transition hover:text-popim-primary focus-visible:outline-2 focus-visible:outline-popim-primary disabled:opacity-60"
          >
            {visible ? <IconEyeSlash size={20} /> : <IconEye size={20} />}
          </button>
        )}
      </div>

      {error && (
        <p id={idError} role="alert" className="mt-1 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
