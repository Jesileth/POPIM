"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CampoTexto from "@/Componentes/CampoTexto";
import BotonPrimario from "@/Componentes/BotonPrimario";
import Mensaje from "@/Componentes/Mensaje";
import { confirmarRecuperacion, solicitarCodigo } from "@/servicios/auth";
import {
  normalizarEmail,
  validarCodigo,
  validarConfirmacion,
  validarEmail,
  validarPassword,
} from "@/lib/validaciones";

export default function RecuperarPasswordPage() {
  const router = useRouter();
  const [paso, setPaso] = useState("correo"); // "correo" o "codigo"
  const [correo, setCorreo] = useState("");
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [infoReenvio, setInfoReenvio] = useState("");
  const [cargando, setCargando] = useState(false);

  // PASO 1: pedir el código al correo
  async function pedirCodigo(evento) {
    evento.preventDefault();
    const { email } = Object.fromEntries(new FormData(evento.currentTarget));

    const error = validarEmail(email);
    setErrores({ email: error });
    setErrorGeneral("");
    if (error) return;

    setCargando(true);
    const respuesta = await solicitarCodigo({ email: normalizarEmail(email) });
    setCargando(false);

    if (!respuesta.ok) {
      setErrorGeneral(respuesta.error);
      return;
    }
    setCorreo(normalizarEmail(email));
    setErrores({});
    setPaso("codigo");
  }

  async function reenviarCodigo() {
    setErrorGeneral("");
    setInfoReenvio("");
    setCargando(true);
    const respuesta = await solicitarCodigo({ email: correo });
    setCargando(false);

    if (!respuesta.ok) {
      setErrorGeneral(respuesta.error);
      return;
    }
    setInfoReenvio("Te enviamos un código nuevo. El anterior ya no sirve.");
  }

  // PASO 2: código + nueva contraseña
  async function cambiarPassword(evento) {
    evento.preventDefault();
    const datos = Object.fromEntries(new FormData(evento.currentTarget));

    const nuevosErrores = {
      codigo: validarCodigo(datos.codigo),
      password: validarPassword(datos.password),
      confirmar: validarConfirmacion(datos.password, datos.confirmar),
    };
    setErrores(nuevosErrores);
    setErrorGeneral("");
    setInfoReenvio("");
    if (Object.values(nuevosErrores).some(Boolean)) return;

    setCargando(true);
    const respuesta = await confirmarRecuperacion({
      email: correo,
      codigo: datos.codigo.trim(),
      password: datos.password,
    });
    setCargando(false);

    if (!respuesta.ok) {
      setErrorGeneral(respuesta.error);
      return;
    }
    router.push("/login"); // el panel vuelve deslizándose a la izquierda
  }

  return (
    <>
      <p className="text-sm text-popim-muted">Recuperación de acceso</p>
      <h1 className="mt-1 text-4xl font-semibold text-popim-ink">Recuperar Contraseña</h1>

      {paso === "correo" ? (
        <>
          <p className="mt-3 max-w-sm text-base text-popim-muted">
            Ingresa el correo asociado a tu cuenta. Te enviaremos un código de verificación.
          </p>

          <form onSubmit={pedirCodigo} noValidate className="mt-6 flex flex-col gap-4">
            <CampoTexto
              id="email"
              etiqueta="Correo Electrónico."
              tipo="email"
              placeholder="Correo Electronico"
              autoComplete="email"
              error={errores.email}
            />
            <BotonPrimario cargando={cargando}>Enviar Código</BotonPrimario>
            {errorGeneral && <Mensaje tipo="error">{errorGeneral}</Mensaje>}
            <Mensaje tipo="aviso">
              El código es de un solo uso y expira 15 minutos después de enviado, por
              seguridad.
            </Mensaje>
          </form>
        </>
      ) : (
        <>
          <p className="mt-3 max-w-sm text-base text-popim-muted">
            Enviamos un código de 6 dígitos a{" "}
            <span className="font-semibold text-popim-ink">{correo}</span>. Escríbelo y
            elige tu nueva contraseña.
          </p>

          <form onSubmit={cambiarPassword} noValidate className="mt-6 flex flex-col gap-4">
            <CampoTexto
              id="codigo"
              etiqueta="Código de verificación."
              placeholder="6 dígitos"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              error={errores.codigo}
            />
            <CampoTexto
              id="password"
              etiqueta="Nueva contraseña."
              tipo="password"
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              error={errores.password}
            />
            <CampoTexto
              id="confirmar"
              etiqueta="Confirmar contraseña."
              tipo="password"
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              error={errores.confirmar}
            />

            {errorGeneral && <Mensaje tipo="error">{errorGeneral}</Mensaje>}
            {infoReenvio && <Mensaje tipo="info">{infoReenvio}</Mensaje>}
            <BotonPrimario cargando={cargando}>Cambiar contraseña</BotonPrimario>
          </form>

          <p className="mt-3 text-center text-xs">
            ¿No llegó?{" "}
            <button
              type="button"
              onClick={reenviarCodigo}
              disabled={cargando}
              className="text-popim-primary underline disabled:opacity-60"
            >
              Reenviar código.
            </button>
          </p>
        </>
      )}

      <p className="mt-8 text-center text-xs">
        ¿Recordaste tu contraseña?{" "}
        <Link href="/login" className="text-popim-primary underline">
          Iniciar Sesión.
        </Link>
      </p>
    </>
  );
}


