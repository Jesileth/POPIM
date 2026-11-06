"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CampoTexto from "@/Componentes/campos/CampoTexto";
import BotonPrimario from "@/Componentes/campos/BotonPrimario";
import Mensaje from "@/Componentes/Mensaje";
import { IconInfo } from "@/Componentes/Iconos";
import {
  validarIdentificadorLogin,
  validarObligatorio,
  normalizarIdentificadorLogin,
} from "@/lib/validaciones";
import { iniciarSesion } from "@/servicios/auth";

// Dirección del portal de propietarios (se define en .env.local)
const URL_PORTAL_PROPIETARIO =
  process.env.NEXT_PUBLIC_URL_PROPIETARIO ?? "http://localhost:3000";

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
    // replace: así el botón "atrás" no regresa al login
    router.replace("/agenda");
  }

  return (
    <>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-popim-primary">
        Acceso del personal
      </p>
      <h1 className="mt-1.5 text-[32px] font-extrabold text-popim-ink">Iniciar sesión</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-popim-texto">
        Usa la cuenta que te asignó tu clínica.
      </p>

      <form onSubmit={enviar} noValidate className="mt-6 flex flex-col gap-4">
        <CampoTexto
          id="identificador"
          etiqueta="Correo electrónico o teléfono"
          placeholder="nombre@clinica.com"
          autoComplete="username"
          icono="Iconcorreo"
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

        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-popim-texto">
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

        <div className="pt-1">
          <BotonPrimario cargando={cargando}>Iniciar sesión</BotonPrimario>
        </div>
      </form>

      {/* Aviso para el personal nuevo */}
      <div className="mt-6 flex items-center gap-3 rounded-xl bg-popim-info px-3.5 py-3 text-sm text-popim-texto">
        <IconInfo size={18} className="shrink-0 text-popim-primary" />
        <span>
          ¿Primera vez?{" "}
          <Link href="/activar-cuenta" className="font-bold text-popim-primary hover:underline">
            Activa tu cuenta
          </Link>{" "}
          con el código que te enviamos.
        </span>
      </div>

      {/* Por si un propietario entra al portal equivocado */}
      <p className="mt-6 border-t border-popim-linea pt-5 text-sm text-popim-texto">
        ¿Eres propietario de una mascota?{" "}
        <a href={URL_PORTAL_PROPIETARIO} className="font-bold text-popim-primary hover:underline">
          Ir al portal de propietarios →
        </a>
      </p>
    </>
  );
}