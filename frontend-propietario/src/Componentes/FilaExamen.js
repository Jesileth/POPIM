import Link from "next/link";
import BotonDescarga from "@/Componentes/BotonDescarga";
import { IconFileMedical, IconFilePdf } from "@/Componentes/Iconos";
import { descargarExamen } from "@/servicios/consultas";
import { formatearFechaHora, formatearTamano } from "@/lib/formato";

export default function FilaExamen({ examen, mostrarConsulta = false }) {
  const esPdf = examen.mimeType === "application/pdf";

  return (
    <li className="flex flex-col gap-3 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-popim-info text-popim-primary">
          {esPdf ? <IconFilePdf size={18} /> : <IconFileMedical size={18} />}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-popim-ink">{examen.tipoExamen.nombre}</p>
          <p className="truncate text-xs text-popim-muted">
            {examen.nombreOriginal} · {formatearTamano(examen.tamanoBytes)} · {formatearFechaHora(examen.fechaCarga)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {mostrarConsulta && examen.consultaId && (
          <Link
            href={`/consultas/${examen.consultaId}`}
            className="text-xs font-semibold text-popim-primary hover:underline"
          >
            Ver consulta
          </Link>
        )}
        <BotonDescarga onDescargar={() => descargarExamen(examen)}>Descargar</BotonDescarga>
      </div>
    </li>
  );
}