import Image from "next/image";

export default function HeaderPopim() {
  return (
    <header
      className="mx-auto flex max-w-250 items-center gap-2 rounded-full px-4 py-1.5 sm:px-8"
      style={{
        background:
          "linear-gradient(90deg, var(--color-popim-header-from) 10%, var(--color-popim-header-to) 100%)",
      }}
    >
      <Image
        src="/Imagenes/LogoPopim.png"
        alt="Mascota de POPIM"
        width={72}
        height={72}
        priority
        className="h-10 w-10 object-contain"
      />
      <div className="text-white">
        <p className="text-xl font-semibold leading-none">POPIM</p>
        <p className="mt-0.5 text-sm font-light">Gestión de Citas y Salud Animal</p>
      </div>
    </header>
  );
}