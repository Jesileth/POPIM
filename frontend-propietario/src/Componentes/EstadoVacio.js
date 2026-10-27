import Link from "next/link";

export default function EstadoVacio({ icono: Icono, titulo, texto, accion }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-popim-borde bg-white px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-popim-info text-popim-primary">
        <Icono size={22} />
      </span>
      <h2 className="mt-4 text-base font-semibold text-popim-ink">{titulo}</h2>
      <p className="mt-1 max-w-sm text-sm text-popim-muted">{texto}</p>
      {accion && (
        <Link
          href={accion.href}
          className="mt-5 inline-flex h-10 items-center rounded-xl bg-popim-primary px-5 text-sm font-semibold text-white shadow-lg shadow-popim-primary/25 transition hover:bg-popim-primary-dark"
        >
          {accion.texto}
        </Link>
      )}
    </div>
  );
}