const UNIDADES = [
  { valor: "ANIOS", texto: "Años" },
  { valor: "MESES", texto: "Meses" },
];

export default function CampoEdad({ error = "" }) {
  return (
    <div>
      <label htmlFor="edad" className="mb-1.5 block text-sm font-semibold text-popim-ink">
        Edad
      </label>

      <div className="flex items-center gap-3">
        <input
          id="edad"
          name="edad"
          type="number"
          inputMode="numeric"
          min={1}
          placeholder="Ej. 3"
          required
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? "edad-error" : undefined}
          className={`h-11 min-w-0 flex-1 rounded-xl border bg-popim-campo px-4 text-sm text-popim-ink outline-none transition placeholder:text-popim-placeholder focus:border-popim-primary focus:ring-4 focus:ring-popim-primary/15 ${
            error ? "border-red-700" : "border-popim-linea"
          }`}
        />

        {/* Selector de unidad: radios con aspecto de botones, osea como lo conozco yo un radio button  */}
        <fieldset className="flex h-11 shrink-0 rounded-xl border border-popim-linea bg-popim-campo p-1">
          <legend className="sr-only">Unidad de la edad</legend>
          {UNIDADES.map(({ valor, texto }) => (
            <label key={valor} className="flex cursor-pointer">
              <input
                type="radio"
                name="unidadEdad"
                value={valor}
                defaultChecked={valor === "anios"}
                className="peer sr-only"
              />
              <span className="flex items-center rounded-lg px-3 text-sm font-semibold text-popim-muted transition peer-checked:bg-popim-primary peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-popim-primary">
                {texto}
              </span>
            </label>
          ))}
        </fieldset>
      </div>

      {error && (
        <p id="edad-error" role="alert" className="mt-1 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}