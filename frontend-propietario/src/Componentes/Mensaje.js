// es la cajita de aviso del prototipo de recuperar, más una versión de error

import { IconStopwatch } from "@/Componentes/Iconos";

export default function Mensaje({ tipo = "aviso", children }) {
  const estilos =
    tipo === "error"
      ? "border-red-700/40 bg-red-50 text-red-800"
      : "border-popim-aviso-borde bg-popim-aviso text-popim-ink";

  return (
    <div
      role={tipo === "error" ? "alert" : "status"}
      className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${estilos}`}
    >
      {tipo === "aviso" && <IconStopwatch size={14} className="mt-px shrink-0" />}
      <p className="w-full text-center leading-snug">{children}</p>
    </div>
  );
}