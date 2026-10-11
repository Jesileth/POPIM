
const VARIANTES = {
  primario:
    "bg-popim-primary hover:bg-popim-primary-dark focus-visible:outline-popim-primary",
  exito:
    "bg-popim-exito hover:bg-popim-exito-dark focus-visible:outline-popim-exito",
};

export default function BotonPrimario({
  children,
  type = "submit",
  cargando = false,
  disabled = false,
  onClick,
  variante = "primario",
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={cargando || disabled}
      aria-busy={cargando}
      className={`mt-1 h-11 w-full rounded-xl font-medium text-white transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTES[variante]}`}
    >
      {cargando ? "Procesando..." : children}
    </button>
  );
}