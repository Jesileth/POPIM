
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CampoTexto from "@/Componentes/campos/CampoTexto";
import BotonPrimario from "@/Componentes/campos/BotonPrimario";
import Mensaje from "@/Componentes/Mensaje";
import { IconInfo } from "@/Componentes/Iconos";

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
        Bienvenido de vuelta a tu veterinaria
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

        <div className="my-2 flex items-center justify-between pt-1 text-xs">
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
        {/* Agregamos una envoltura con pt-2 para separar el botón del resto */}
        <div className="pt-2">
        <BotonPrimario cargando={cargando}>Iniciar sesión</BotonPrimario>
        </div>
      </form>

     
    </>
  );
}