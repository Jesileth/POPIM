

import Link from "next/link";

const NOMBRES_ROL = {
  RECEPCIONISTA: "Recepcionista",
  VETERINARIO: "Veterinario",
  ADMINISTRADOR: "Administrador",
  SUPER_ADMIN: "Super administrador",
};

// "Clínica San Roque" → "CS"
// "Dra. Mariana Rojas" → "MR" · "Clínica San Roque" → "CS" (se salta Dr./Dra.)
function iniciales(texto = "") {
  return texto
    .replace(/^Dra?\.\s*/, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((palabra) => palabra[0])
    .join("")
    .toUpperCase();
}

export default function Encabezado({ usuario, titulo }) {
  const clinica = usuario?.clinica;
    // El Super Administrador no pertenece a una clínica: administra toda la red
  const nombreClinica = clinica?.nombreComercial ?? (usuario?.rol === "SUPER_ADMIN" ? "Red POPIM" : "Mi clínica");

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-popim-linea bg-white px-5 py-3.5 lg:px-8">
      {/* Clínica */}
      <div className="flex items-center gap-3">
        {clinica?.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={clinica.logoUrl}
            alt={`Logo de ${nombreClinica}`}
            className="h-11 w-11 rounded-xl border border-popim-linea object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-popim-linea bg-popim-info text-sm font-extrabold text-popim-primary"
          >
            {iniciales(nombreClinica)}
          </div>
        )}
        <div>
          <p className="font-extrabold text-popim-ink">{nombreClinica}</p>
          {titulo && <p className="text-[13px] text-popim-texto">{titulo}</p>}
        </div>
      </div>

      {/* Persona que inició sesión */}
      <Link href="/perfil" className="flex items-center gap-2.5 rounded-xl p-1 hover:bg-popim-page">
        <span className="text-right">
          <span className="block text-sm font-semibold text-popim-ink">{usuario?.nombreCompleto}</span>
          <span className="text-xs text-popim-texto">{NOMBRES_ROL[usuario?.rol] ?? ""}</span>
        </span>
        {usuario?.fotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={usuario.fotoUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-popim-panel-oscuro text-sm font-bold text-white">
            {iniciales(usuario?.nombreCompleto)}
          </span>
        )}
      </Link>
    </header>
  );
}