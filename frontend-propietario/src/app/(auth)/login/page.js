import Image from "next/image";
import Link from "next/link";
import HeaderPopim from "@/Componentes/HeaderPopim";
import PawIcon from "@/Componentes/PawIcon";

export const metadata = { title: "Iniciar sesión | POPIM" };

export default function LoginPage() {
  return (
    <main className="px-4 py-6 sm:px-8 sm:py-10">
      <HeaderPopim />

      {/* Tarjeta central: dos mitades pegadas */}
      <div className="mx-auto mt-10 grid min-h-[500px] max-w-[980px] overflow-hidden rounded-[40px] shadow-sm lg:grid-cols-2">
        {/* ---------- Panel izquierdo (solo en pantallas grandes) ---------- */}
        <section className="relative hidden overflow-hidden bg-popim-primary lg:block">
          <div className="absolute left-10 top-9">
            <p className="text-5xl font-semibold leading-none text-white">POPIM</p>
            <p className="mt-2 font-slab text-xl text-[#1f3a4a]">
              Red de clinicas veterinarias
            </p>
          </div>

          {/* Huellitas decorativas */}
          <PawIcon className="absolute right-[24%] top-9 h-16 w-16 rotate-[15deg] text-popim-paw" />
          <PawIcon className="absolute right-[6%] top-[110px] h-14 w-14 rotate-[20deg] text-popim-paw" />
          <PawIcon className="absolute bottom-16 left-8 h-12 w-12 -rotate-[10deg] text-popim-paw" />

          {/* Mascota semitransparente al centro */}
          <Image
            src="/Imagenes/LogoPopim.png"
            alt=""
            width={450}
            height={450}
            className="absolute bottom-[160px] left-1/2 -translate-x-1/2 opacity-60"
          />

          {/* Lema sobre la mascota */}
          <p className="absolute bottom-18 left-10 right-10 text-4xl font-semibold leading-[1.4] text-white">
            Tu mascota, en buenas manos.
          </p>
        </section>

        {/* ---------- Panel derecho: formulario ---------- */}
        <section className="flex flex-col justify-center bg-white px-8 py-10 sm:px-12">
          <p className="text-sm uppercase tracking-wide text-popim-muted">
            Bienvenido de vuelta.
          </p>
          <h1 className="mt-1 text-4xl font-semibold text-popim-ink">Iniciar Sesión.</h1>
          <p className="mt-3 max-w-xs text-base text-popim-muted">
            Ingresa con el correo electrónico y la contraseña de tu cuenta de propietario.
          </p>

          <form className="mt-6 flex flex-col gap-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-semibold">
                Correo Electrónico.
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="h-11 w-full rounded-lg border border-popim-ink/70 bg-popim-page px-3 outline-none focus:ring-2 focus:ring-popim-primary"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-semibold">
                Contraseña.
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="h-11 w-full rounded-lg border border-popim-ink/70 bg-popim-page px-3 outline-none focus:ring-2 focus:ring-popim-primary"
              />
              <div className="mt-2 text-right">
                <Link
                  href="/recuperar-password"
                  className="text-sm italic text-popim-primary underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              className="mt-1 h-11 w-full rounded-xl bg-popim-primary font-medium text-white transition hover:bg-popim-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-popim-primary"
            >
              Iniciar Sesión.
            </button>
          </form>

          <p className="mt-5 text-center text-xs">
            ¿Te registraste en la clínica con el recepcionista pero es tu primer ingreso?
            <br />
            <Link href="/activar-cuenta" className="text-popim-primary underline">
              Activa tu cuenta aquí.
            </Link>
          </p>

          <p className="mt-8 text-center text-xs">
            ¿Aún no tienes una cuenta?{" "}
            <Link href="/registro" className="text-popim-primary underline">
              Regístrate.
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}