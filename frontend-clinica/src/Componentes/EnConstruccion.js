

//

"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { IconArrowLeft } from "@/Componentes/Iconos";

export default function EnConstruccion({ modulo = "Este módulo", pendiente = "Próximamente" }) {
  const router = useRouter();

  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 rounded-3xl border border-popim-linea bg-white px-6 py-10 text-center sm:px-10">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-popim-linea">
        <Image
          src="/Imagenes/Perrito Programador.jpg"
          alt="Perrito con lentes trabajando frente a una computadora"
          width={736}
          height={541}
          className="h-auto w-full"
          priority
        />
      </div>

      <div>
        <span className="inline-block rounded-full bg-popim-pendiente px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-popim-pendiente-texto">
          En construcción
        </span>
        <h1 className="mt-3 text-[28px] font-extrabold leading-tight text-popim-ink">
          {modulo} todavía no está listo
        </h1>
        <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-popim-texto">
          Nuestro equipo de frontend sigue trabajando en este módulo. Mientras tanto, puedes
          usar las otras opciones del menú.
        </p>
        <p className="mt-3 text-sm font-semibold text-popim-ink">
          Pendiente: <span className="text-popim-primary">{pendiente}</span>
        </p>
      </div>

      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex min-h-11 items-center rounded-xl bg-popim-primary px-5 text-sm font-bold text-white transition hover:bg-popim-primary-dark"
      >
     <IconArrowLeft size={16} className="mr-2" />
        ← Volver
      </button>
    </section>
  );
}