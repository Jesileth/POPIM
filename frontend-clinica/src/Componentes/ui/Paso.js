// Tarjeta numerada: "1 Propietario", "2 Mascota"...
export default function Paso({ numero, titulo, deshabilitado = false, children }) {
  return (
    <section className={`rounded-2xl border border-popim-linea p-5 ${deshabilitado ? "bg-white/60" : "bg-white"}`}>
      <h2 className={`flex items-center gap-3 text-lg font-bold ${deshabilitado ? "text-popim-texto" : "text-popim-ink"}`}>
        <span className={`flex h-7 w-7 items-center justify-center rounded-full bg-popim-primary text-xs font-bold text-white ${deshabilitado ? "opacity-60" : ""}`}>
          {numero}
        </span>
        {titulo}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
