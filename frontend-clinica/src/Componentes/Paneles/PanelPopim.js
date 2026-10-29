import Image from "next/image";
import PawIcon from "@/Componentes/Paneles/PawIcon";
import { IconCheck } from "@/Componentes/Iconos";

const BENEFICIOS_POR_DEFECTO = ["Citas en línea", "Historial clínico", "Datos seguros"];

export default function PanelPopim({ lema, beneficios = BENEFICIOS_POR_DEFECTO }) {
  // El titular llega como lista de dos líneas (oscura + azul) o como un texto simple
  const [linea1, linea2] = Array.isArray(lema) ? lema : [lema, ""];

  return (
    <section
      className="relative h-full overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, var(--color-popim-panel-inicio), var(--color-popim-panel-fin))",
      }}
    >
      {/* PARTE DE ARRIBA: etiqueta, titular, subtítulo y chips */}
      <div className="relative z-10 px-9 pt-9">
        <span className="inline-block rounded-full bg-popim-chip px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-popim-primary">
          Red de clínicas veterinarias POPIM
        </span>

        {/* La key hace que el fundido se repita cada vez que cambia el titular */}
        <h2
          key={`${linea1}${linea2}`}
          className="mt-5 animate-aparecer text-3xl font-bold leading-[1.15] text-popim-ink motion-reduce:animate-none"
        >
          {linea1}
          {linea2 && (
            <>
              <br />
              <span className="text-popim-primary">{linea2}</span>
            </>
          )}
        </h2>

        <p className="mt-3 max-w-xs text-sm leading-snug text-popim-texto">
          Atiende consultas, registra vacunas, emite recetas y gestiona el expediente clínico de tus pacientes en tiempo real.
        </p>

        <ul className="mt-4 flex flex-wrap gap-2">
          {beneficios.map((beneficio) => (
            <li
              key={beneficio}
              className="flex items-center gap-1.5 rounded-full bg-popim-chip px-3 py-1 text-[11px] text-popim-texto"
            >
              <IconCheck size={13} />
              {beneficio}
            </li>
          ))}
        </ul>
      </div>

      {/* PATITAS decorativas: arriba a la derecha y a los lados del arco */}
      <PawIcon className="absolute right-[8%] top-12 h-8 w-8 rotate-18 text-popim-paw" />
      <PawIcon className="absolute right-[22%] top-25 h-6 w-6 rotate-[-10deg] text-popim-paw" />
      <PawIcon className="absolute bottom-42.5 left-[3.5%] h-7 w-7 rotate-[-14deg] text-popim-paw" />
      <PawIcon className="absolute bottom-24 left-[6%] h-6 w-6 rotate-10 text-popim-paw" />
      <PawIcon className="absolute bottom-7 left-[4%] h-5 w-5 rotate-20 text-popim-paw" />
      <PawIcon className="absolute bottom-47.5 right-[4%] h-7 w-7 rotate-16 text-popim-paw" />
      <PawIcon className="absolute bottom-28 right-[7%] h-6 w-6 rotate-[-8deg] text-popim-paw" />

      {/* PARTE DE ABAJO: arco claro con la foto, pegado al borde inferior */}
      <div className="absolute inset-x-0 bottom-0 flex justify-center">
        <div className="relative h-53.75 w-100 rounded-t-full bg-white/55"> {/*Circulo*/}
          <Image
            src="/Imagenes/mascotas.png"
            alt=""
            width={900}
            height={420}
            className="absolute bottom-0 left-1/2 h-auto w-[120%] -translate-x-1/2"
            style={{
            transform: "scale(1.19) translateY(70px)",
            transformOrigin: "center bottom",
          }}
          />
        </div>
      </div>
    </section>
  );
}