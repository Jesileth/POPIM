export default function TarjetaSeccion({ titulo, icono: Icono, acciones, children }) {
  return (
    <section className="rounded-2xl border border-popim-linea bg-white">
      <header className="flex items-center justify-between gap-3 border-b border-popim-linea px-5 py-4">
        <h2 className="flex items-center gap-2.5 text-base font-semibold text-popim-ink">
          {Icono && (
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-popim-info text-popim-primary">
              <Icono size={16} />
            </span>
          )}
          {titulo}
        </h2>
        {acciones}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}