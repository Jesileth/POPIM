import PawIcon from "@/Componentes/Paneles/PawIcon";

// Los tres tipos de personal que usan el portal (solo informativo)
const ROLES = [
  { titulo: "Recepción", texto: "Agenda, confirma y reprograma citas", icono: "agenda" },
  { titulo: "Veterinarios", texto: "Atiende y registra cada consulta", icono: "estetoscopio" },
  { titulo: "Administración", texto: "Gestiona personal y horarios", icono: "personas" },
];

// Íconos de línea para cada rol
function IconoRol({ tipo }) {
  const trazos = {
    agenda: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    estetoscopio: (
      <>
        <path d="M6 3v6a4 4 0 0 0 8 0V3M10 13v3a5 5 0 0 0 10 0v-2" />
        <circle cx="20" cy="12" r="2" />
      </>
    ),
    personas: (
      <>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 20a6.5 6.5 0 0 0-2.5-5.1" />
      </>
    ),
  };

  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {trazos[tipo]}
    </svg>
  );
}

export default function PanelPopim({ lema }) {
  // El titular llega como lista de dos líneas (blanca + celeste) o como un texto simple
  const [linea1, linea2] = Array.isArray(lema) ? lema : [lema, ""];

  return (
    <section
      className="relative flex w-full flex-col justify-between gap-10 overflow-hidden bg-popim-panel-oscuro p-12 text-white"
      style={{
        // Cuadrícula fina de fondo
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
        backgroundSize: "56px 56px",
      }}
    >
      {/* ARRIBA: logo */}
      <div className="flex items-center gap-3.5">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-popim-primary">
          <PawIcon className="h-6 w-6 text-white" />
        </span>
        <div>
          <p className="text-[22px] font-extrabold tracking-wide">POPIM</p>
          <p className="text-[13px] text-popim-panel-suave">Portal de clínicas</p>
        </div>
      </div>

      {/* CENTRO: lema, descripción y roles */}
      <div className="flex max-w-120 flex-col gap-7">
        <div>
          {/* La key hace que el fundido se repita cada vez que cambia el lema */}
          <h2
            key={`${linea1}${linea2}`}
            className="animate-aparecer text-[44px] font-extrabold leading-[1.12] motion-reduce:animate-none"
          >
            {linea1}
            {linea2 && (
              <>
                <br />
                <span className="text-popim-panel-acento">{linea2}</span>
              </>
            )}
          </h2>
          <p className="mt-3.5 text-[17px] leading-relaxed text-popim-panel-texto">
            Agenda, recepción y expedientes de tu clínica en un solo lugar, conectados con
            los propietarios de la red POPIM.
          </p>
        </div>

        <ul className="flex flex-col gap-3">
          {ROLES.map((rol) => (
            <li
              key={rol.titulo}
              className="flex items-center gap-3.5 rounded-2xl border border-white/12 bg-white/7 px-4 py-3.5"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/12">
                <IconoRol tipo={rol.icono} />
              </span>
              <span>
                <span className="block font-bold">{rol.titulo}</span>
                <span className="text-sm text-popim-panel-texto">{rol.texto}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* ABAJO: pie */}
      <p className="text-[13px] text-popim-panel-suave">
        © {new Date().getFullYear()} POPIM · Red de clínicas veterinarias
      </p>
    </section>
  );
}