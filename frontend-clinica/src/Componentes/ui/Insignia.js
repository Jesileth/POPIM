import { CUENTAS, ESTADOS } from "@/lib/estados";

export function InsigniaEstado({ codigo, className = "" }) {
  const e = ESTADOS[codigo];
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${e.chip} ${className}`}>
      {e.nombre}
    </span>
  );
}

export function InsigniaCuenta({ estado, className = "" }) {
  const e = CUENTAS[estado];
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${e.chip} ${className}`}>
      {e.nombre}
    </span>
  );
}
