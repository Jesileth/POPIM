import Image from "next/image";

export default function HeaderPopim() {
  return (
    /* José Torres - Header Class-Name : Agregar o retirar el W-full si se desea que todo el header ocupe toda la zona horizontal o no*/
    <header
      className="mx-auto flex max-w-270 w-full shrink-0 items-center gap-2 rounded-full px-5 py-2 sm:px-8 sm:py-3"
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
        <p className="text-2xl font-semibold leading-none sm:text-3x1">POPIM</p>
        <p className="mt-1 text-sm font-light sm:text-sm">Gestión de Citas y Salud Animal</p>
      </div>
    </header>
  );
}