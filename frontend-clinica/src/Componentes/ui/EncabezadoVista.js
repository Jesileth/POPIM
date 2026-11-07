export default function EncabezadoVista({ titulo, descripcion, subtitulo, children }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {subtitulo && <p className="text-sm text-popim-muted">{subtitulo}</p>}
        <h1 className="text-2xl font-bold sm:text-3xl text-popim-ink">{titulo}</h1>
        {descripcion && <p className="mt-1 text-sm text-popim-muted">{descripcion}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-3">{children}</div>}
    </header>
  );
}
