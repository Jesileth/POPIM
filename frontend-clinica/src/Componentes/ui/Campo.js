const BASE =
  "w-full rounded-xl border bg-white px-3.5 text-sm text-popim-ink outline-none transition placeholder:text-popim-placeholder focus:border-popim-primary focus:ring-4 focus:ring-popim-primary/15 disabled:cursor-not-allowed disabled:bg-slate-100 read-only:bg-slate-50 read-only:text-popim-texto";

// <Campo id="nombre" etiqueta="Nombre completo" obligatorio value={..} onChange={..} error={..} />
export default function Campo({ id, etiqueta, obligatorio = false, error = "", multilinea = false, className = "", ...resto }) {
  const Etiqueta = multilinea ? "textarea" : "input";
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-semibold text-popim-ink">
        {etiqueta}
        {obligatorio && " *"}
      </label>
      <Etiqueta
        id={id}
        name={id}
        aria-invalid={error ? "true" : undefined}
        className={`${BASE} ${multilinea ? "min-h-24 py-2.5" : "h-11"} ${error ? "border-red-700" : "border-popim-linea"}`}
        {...resto}
      />
      {error && <p role="alert" className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}
