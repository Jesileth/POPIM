export default function CampoSelect({ id, etiqueta, opciones, error = "" }) {
  const idError = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-popim-ink">
        {etiqueta}
      </label>
      <select
        id={id}
        name={id}
        required
        defaultValue=""
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? idError : undefined}
        className={`h-12 w-full rounded-xl border bg-popim-campo px-4 text-sm text-popim-ink outline-none transition focus:border-popim-primary focus:ring-4 focus:ring-popim-primary/15 ${
          error ? "border-red-700" : "border-popim-linea"
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