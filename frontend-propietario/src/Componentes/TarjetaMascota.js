import Link from "next/link";
import { formatearEdad } from "@/lib/formato";

export default function TarjetaMascota({ mascota }) {
  const { id, nombre, codigoUnico, especie, raza, sexo, edadActualMeses, fotoUrl } = mascota;

  return (
    <article className="flex flex-col rounded-2xl border border-popim-linea bg-white p-5 shadow-[0_1px_2px_rgba(36,65,95,0.04)] transition hover:shadow-md">
      <div className="flex items-center gap-3">
        {fotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fotoUrl} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-popim-info text-lg font-bold text-popim-primary">
            {nombre[0]?.toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-popim-ink">{nombre}</h2>
          <span className="mt-0.5 inline-block rounded-md bg-popim-info px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wide text-popim-primary">
            {codigoUnico}
          </span>
        </div>
      </div>

      <dl className="mt-4 space-y-1.5 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-popim-etiqueta">Especie</dt>
          <dd className="text-right text-popim-texto">
            {especie.nombre} · {raza?.nombre ?? "Mestizo"}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-popim-etiqueta">Sexo</dt>
          <dd className="text-popim-texto">{sexo === "MACHO" ? "Macho" : "Hembra"}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-popim-etiqueta">Edad</dt>
          <dd className="text-popim-texto">{formatearEdad(edadActualMeses)}</dd>
        </div>
      </dl>

      <Link
        href={`/mis-mascotas/${id}`}
        className="mt-5 inline-flex h-10 items-center justify-center rounded-xl border border-popim-primary/40 text-sm font-semibold text-popim-primary transition hover:bg-popim-info"
      >
        Ver ficha
      </Link>
    </article>
  );
}
