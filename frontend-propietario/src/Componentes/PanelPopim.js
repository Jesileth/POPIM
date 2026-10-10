

import Image from "next/image";
import PawIcon from "@/Componentes/PawIcon";

export default function PanelPopim({ lema }) {
  return (
    <section className="relative h-full overflow-hidden bg-popim-primary">
      <div className="absolute left-10 top-9">
        <p className="text-5xl font-semibold leading-none text-white">POPIM</p>
        <p className="mt-2 font-slab text-xl text-[#1f3a4a]">
          Red de clinicas veterinarias
        </p>
      </div>

      <PawIcon className="absolute right-[24%] top-9 h-16 w-16 rotate-15 text-popim-paw" />
      <PawIcon className="absolute right-[6%] top-27.5 h-14 w-14 rotate-20 text-popim-paw" />
      <PawIcon className="absolute bottom-16 left-8 h-12 w-12 rotate-[-10deg] text-popim-paw" />

      <Image
        src="/Imagenes/nacka.png"
        alt=""
        width={450}
        height={450}
        className="absolute bottom-20 left-1/2 -translate-x-1/2 opacity-60"
      />

      <p
        key={lema}
        className="absolute bottom-32.5 left-5 right-5 animate-aparecer text-4xl font-semibold leading-[1.4] text-white"
      >
        {lema}
      </p>
    </section>
  );
}