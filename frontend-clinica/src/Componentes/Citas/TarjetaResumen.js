import Link from "next/link";

// Indicador de "Recepción de hoy": punto de color + título + número + pie
export default function TarjetaResumen({ punto, titulo, valor, pie, destacada = false, href }) {
  const clase = `block rounded-2xl border p-4 ${destacada ? "border-amber-300 bg-amber-50" : "border-popim-linea bg-white"}`;
  const cuerpo = (
    <>
      <p className="flex items-center gap-2 text-sm font-semibold text-popim-ink">
        <span className={`h-2.5 w-2.5 rounded-full ${punto}`} />
        {titulo}
      </p>
      <p className="mt-1 text-3xl font-bold text-popim-ink">{valor}</p>
      <p className={`text-xs ${destacada ? "font-semibold text-amber-700" : "text-popim-muted"}`}>{pie}</p>
    </>
  );
  return href ? <Link href={href} className={clase}>{cuerpo}</Link> : <div className={clase}>{cuerpo}</div>;
}
