const ESTILOS = {
  error: "border-red-700/40 bg-red-50 text-red-800",
  info: "border-popim-aviso-borde bg-popim-aviso text-popim-ink",
  ok: "border-emerald-300 bg-emerald-50 text-emerald-800",
};

export default function Aviso({ tipo = "info", children }) {
  return (
    <div role={tipo === "error" ? "alert" : "status"} className={`rounded-lg border px-3 py-2 text-sm ${ESTILOS[tipo]}`}>
      {children}
    </div>
  );
}
