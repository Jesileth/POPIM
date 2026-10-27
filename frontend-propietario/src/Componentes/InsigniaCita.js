const ESTILOS = {
  SOLICITADA: "bg-amber-50 text-amber-800 ring-amber-200",
  CONFIRMADA: "bg-popim-info text-popim-primary ring-popim-aviso-borde",
  ATENCION: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  COMPLETADA: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  CANCELADA: "bg-slate-100 text-slate-600 ring-slate-200",
};

export default function InsigniaCita({ estado }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${
        ESTILOS[estado.codigo] ?? ESTILOS.SOLICITADA
      }`}
    >
      {estado.nombre}
    </span>
  );
}