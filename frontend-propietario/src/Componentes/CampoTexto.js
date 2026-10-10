
"use client"

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
}) {
  const idError = `${id}-error`;

  function alEscribir(evento) {
    evento.target.value = formato(evento.target.value);
  }


  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold">
        {etiqueta}
      </label>
      <input
        id={id}
        name={id}
        type={tipo}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        disabled={disabled}
        onChange={formato ? alEscribir : undefined}
        required
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? idError : undefined}
        className={`h-11 w-full rounded-lg border bg-popim-page px-3 text-sm outline-none placeholder:text-popim-muted focus:ring-2 focus:ring-popim-primary disabled:cursor-not-allowed disabled:opacity-60 ${
          error ? "border-red-700" : "border-popim-ink/70"
        }`}
      />
      {error && (
        <p id={idError} role="alert" className="mt-1 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}