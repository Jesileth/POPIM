import Image from "next/image";
import PawIcon from "@/Componentes/PawIcon";
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
      {/* 1. PARTE DE ARRIBA: etiqueta, titular, subtítulo y chips */}
      <div className="relative z-10 px-10 pt-12">
        <span className="inline-block rounded-full bg-popim-chip px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-popim-primary">
          Red de clínicas veterinarias
        </span>

        {/* La key hace que el fundido se repita cada vez que cambia el titular */}
        <h2
          key={`${linea1}${linea2}`}
          className="mt-8 animate-aparecer text-4xl font-bold leading-[1.15] text-popim-ink motion-reduce:animate-none"
        >
          {linea1}
          {linea2 && (
            <>
              <br />
              <span className="text-popim-primary">{linea2}</span>
            </>
          )}
        </h2>

        <p className="mt-4 max-w-68 text-[15px] leading-snug text-popim-texto">
          Agenda citas y revisa la salud de tu mascota en cualquier clínica de la red.
        </p>

        <ul className="mt-6 flex flex-wrap gap-2">
          {beneficios.map((beneficio) => (
            <li
              key={beneficio}
              className="flex items-center gap-1.5 rounded-full bg-popim-chip px-3 py-1.5 text-xs text-popim-texto"
            >
              <IconCheck size={14} />
              {beneficio}
            </li>
          ))}
        </ul>
      </div>

      {/* 2. HUELLITAS decorativas */}
      <PawIcon className="absolute bottom-75 left-[14%] h-9 w-9 -rotate-12 text-popim-paw" />
      <PawIcon className="absolute bottom-63.75 right-[12%] h-7 w-7 rotate-12 text-popim-paw" />

      {/* 3. PARTE DE ABAJO: arco claro con la foto, pegado al borde inferior */}
      <div className="absolute inset-x-0 bottom-0 flex justify-center">
        <div className="relative h-62.5 w-[72%] rounded-t-full bg-white/55">
          <Image
            src="/Imagenes/mascotas.png"
            alt=""
            width={700}
            height={720}
            className="absolute bottom-0 left-1/2 h-auto w-[84%] -translate-x-1/2"
          />
        </div>
      </div>
    </section>
  );
}