
const VARIANTES = {
  primario:
    "bg-popim-primary text-white shadow-lg shadow-popim-primary/25 hover:bg-popim-primary-dark focus-visible:outline-popim-primary",
  exito:
    "bg-popim-exito text-white shadow-lg shadow-popim-exito/25 hover:bg-popim-exito-dark focus-visible:outline-popim-exito",
  secundario:
    "border border-popim-primary/40 bg-white text-popim-primary hover:bg-popim-info focus-visible:outline-popim-primary",
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
      className={`mt-1 h-11 w-full rounded-xl font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTES[variante]}`}
    >
      {cargando ? "Procesando..." : children}
    </button>
  );
}