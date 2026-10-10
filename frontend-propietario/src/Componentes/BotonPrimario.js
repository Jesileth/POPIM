
export default function BotonPrimario({
  children,
  type = "submit",
  cargando = false,
  disabled = false,
  onClick,
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={cargando || disabled}
      aria-busy={cargando}
      className="mt-1 h-11 w-full rounded-xl bg-popim-primary font-medium text-white transition hover:bg-popim-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-popim-primary disabled:cursor-not-allowed disabled:opacity-60"
    >
      {cargando ? "Procesando..." : children}
    </button>
  );
}