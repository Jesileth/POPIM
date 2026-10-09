import Image from "next/image";

export default function HeaderPopim() {
  return (
    <header
      className="mx-auto flex max-w-[1080px] items-center gap-4 rounded-full px-6 py-3 sm:px-8"
      style={{
        background:
          "linear-gradient(90deg, var(--color-popim-header-from) 35%, var(--color-popim-header-to) 100%)",
      }}
    >
      <Image
        src="/Imagenes/LogoPopim.png"
        alt="Mascota de POPIM"
        width={72}
        height={72}
        priority
      />
      <div className="text-white">
        <p className="text-3xl font-semibold leading-none">POPIM</p>
        <p className="mt-1 text-sm font-light">Gestión de Citas y Salud Animal</p>
      </div>
    </header>
  );
}