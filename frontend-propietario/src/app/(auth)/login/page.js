
// modificamos todo jaj 


"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CampoTexto from "@/Componentes/CampoTexto";
import BotonPrimario from "@/Componentes/BotonPrimario";
import Mensaje from "@/Componentes/Mensaje";
import { iniciarSesion } from "@/servicios/auth";
import { normalizarEmail, validarEmail, validarObligatorio } from "@/lib/validaciones";

export default function LoginPage() {
  const router = useRouter();
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [cargando, setCargando] = useState(false);

  async function enviar(evento) {
    evento.preventDefault();
    const datos = Object.fromEntries(new FormData(evento.currentTarget));

    const nuevosErrores = {
      email: validarEmail(datos.email),
      password: validarObligatorio(datos.password, "Escribe tu contraseña."),
    };
    setErrores(nuevosErrores);
    setErrorGeneral("");
    if (Object.values(nuevosErrores).some(Boolean)) return;

    setCargando(true);
    const respuesta = await iniciarSesion({
      email: normalizarEmail(datos.email),
      password: datos.password,
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
      <p className="text-sm uppercase tracking-wide text-popim-muted">
        Bienvenido de vuelta.
      </p>
      <h1 className="mt-1 text-4xl font-semibold text-popim-ink">Iniciar Sesión.</h1>
      <p className="mt-3 max-w-xs text-base text-popim-muted">
        Ingresa con el correo electrónico y la contraseña de tu cuenta de propietario.
      </p>

      <form onSubmit={enviar} noValidate className="mt-6 flex flex-col gap-4">
        <CampoTexto
          id="email"
          etiqueta="Correo Electrónico."
          tipo="email"
          autoComplete="email"
          error={errores.email}
        />
        <div>
          <CampoTexto
            id="password"
            etiqueta="Contraseña."
            tipo="password"
            autoComplete="current-password"
            error={errores.password}
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

        {errorGeneral && <Mensaje tipo="error">{errorGeneral}</Mensaje>}
        <BotonPrimario cargando={cargando}>Iniciar Sesión.</BotonPrimario>
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
    </>
  );
}