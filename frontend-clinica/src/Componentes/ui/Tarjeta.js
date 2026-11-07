export default function Tarjeta({ titulo, acciones, punteada = false, className = "", children }) {
  return (
    <section
      className={`rounded-2xl border p-5 ${
        punteada ? "border-dashed border-popim-borde bg-white/60" : "border-popim-linea bg-white"
      } ${className}`}
    >
      {(titulo || acciones) && (
        <header className="mb-4 flex items-center justify-between gap-3">
          {titulo && <h2 className="text-base font-bold text-popim-ink">{titulo}</h2>}
          {acciones}
        </header>
      )}
      {children}
    </section>
  );
}
