

export default function CampoSelect({ id, etiqueta, opciones, error = "" }) {
  const idError = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold">
        {etiqueta}
      </label>
      <select
        id={id}
        name={id}
        required
        defaultValue=""
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? idError : undefined}
        className={`h-11 w-full rounded-lg border bg-white px-3 text-sm text-popim-ink outline-none focus:ring-2 focus:ring-popim-primary ${
          error ? "border-red-700" : "border-popim-ink/70"
        }`}
      >
        <option value="" disabled>
          Selecciona..
        </option>
        {opciones.map((opcion) => (
          <option key={opcion} value={opcion}>
            {opcion}
          </option>
        ))}
      </select>
      {error && (
        <p id={idError} role="alert" className="mt-1 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}