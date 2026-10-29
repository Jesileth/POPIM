export default function EncabezadoPagina({ etiqueta, titulo, descripcion, children }) {
  return (
    <header className="flex flex-col gap-4 border-b border-popim-linea pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-popim-primary">
          {etiqueta}
        </p>
        <h1 className="mt-1.5 text-3xl font-bold text-popim-ink">{titulo}</h1>
        {descripcion && (
          <p className="mt-2 text-sm leading-relaxed text-popim-muted">{descripcion}</p>
        )}
      </div>
      {children}
    </header>
  );
}
