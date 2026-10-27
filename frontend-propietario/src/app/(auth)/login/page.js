
// modificamos todo jaj 

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CampoTexto from "@/Componentes/CampoTexto";
import BotonPrimario from "@/Componentes/BotonPrimario";
import Mensaje from "@/Componentes/Mensaje";
import { IconInfo } from "@/Componentes/Iconos";
import { iniciarSesion } from "@/servicios/auth";
import { validarObligatorio, normalizarIdentificadorLogin, validarIdentificadorLogin } from "@/lib/validaciones";

export default function LoginPage() {
  const router = useRouter();
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [cargando, setCargando] = useState(false);

  async function enviar(evento) {
    evento.preventDefault();
    const datos = Object.fromEntries(new FormData(evento.currentTarget));

      const nuevosErrores = {
      identificador: validarIdentificadorLogin(datos.identificador),
      password: validarObligatorio(datos.password, "Escribe tu contraseña."),
    };
    setErrores(nuevosErrores);
    setErrorGeneral("");
    if (Object.values(nuevosErrores).some(Boolean)) return;

    setCargando(true);
    const respuesta = await iniciarSesion({
      identificador: normalizarIdentificadorLogin(datos.identificador),
      password: datos.password,
      recordarme: Boolean(datos.recordarme),
    });
    setCargando(false);

    if (!respuesta.ok) {
      setErrorGeneral(respuesta.error);
      return;
    }
    router.push("/mis-mascotas");
  }

  return (
    <>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-popim-primary">
        Bienvenido de vuelta
      </p>
      <h1 className="mt-1.5 text-3xl font-bold text-popim-ink">Iniciar sesión</h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-popim-muted">
        Ingresa con el correo electrónico y la contraseña de tu cuenta de propietario.
      </p>

      <form onSubmit={enviar} noValidate className="mt-5 flex flex-col gap-4">
          <CampoTexto
          id="identificador"
          etiqueta="Correo electrónico o teléfono"
          placeholder="nombre@correo.com o 8888-8888"
          autoComplete="username"
          icono="correo"
          error={errores.identificador}
        />
        <CampoTexto
          id="password"
          etiqueta="Contraseña"
          tipo="password"
          placeholder="Tu contraseña"
          autoComplete="current-password"
          icono="candado"
          error={errores.password}
        />

        <div className="flex items-center justify-between gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-popim-muted">
            <input
              type="checkbox"
              name="recordarme"
              className="h-4 w-4 cursor-pointer rounded accent-popim-primary"
            />
            Recordarme
          </label>
          <Link
            href="/recuperar-password"
            className="text-sm font-semibold text-popim-primary hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        {errorGeneral && <Mensaje tipo="error">{errorGeneral}</Mensaje>}
        <BotonPrimario cargando={cargando}>Iniciar sesión</BotonPrimario>
      </form>

      {/* Divisor con etiqueta */}
      <div className="mt-5 flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.15em] text-popim-etiqueta">
        <span className="h-px flex-1 bg-popim-linea" />
        Primer ingreso
        <span className="h-px flex-1 bg-popim-linea" />
      </div>

      {/* Caja informativa */}
      <div className="mt-3 flex items-center justify-center gap-3 rounded-2xl bg-popim-info px-4 py-2.5">
        <IconInfo size={20} className="shrink-0 text-popim-info-acento" />
        <div className="space-y-1 text-xs leading-tight text-popim-info-texto">
          <p>¿Te registraste en la clínica con el recepcionista?</p>
          <Link
            href="/activar-cuenta"
            className="mt-0.5 block text-center text-[13px] font-semibold text-popim-info-acento hover:underline"
          >
            Activa tu cuenta aquí
          </Link>
        </div>
      </div>
    

     {/*
      <p className="mt-5 text-center text-xs">
        ¿Te registraste en la clínica con el recepcionista pero es tu primer ingreso?
        <br />
        <Link href="/activar-cuenta" className="text-popim-primary underline">
          Activa tu cuenta aquí.
        </Link>
      </p>
      */}

      <p className="mt-4 text-center text-xs">
        ¿Aún no tienes una cuenta?{" "}
        <Link href="/registro" className="text-popim-primary underline">
          Regístrate.
        </Link>
      </p>
    </>
  );
}