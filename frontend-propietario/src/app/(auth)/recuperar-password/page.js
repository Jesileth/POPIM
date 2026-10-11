"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CampoTexto from "@/Componentes/CampoTexto";
import CodigoOtp from "@/Componentes/CodigoOtp";
import BotonPrimario from "@/Componentes/BotonPrimario";
import Mensaje from "@/Componentes/Mensaje";
import { usePanel } from "@/lib/panelContexto";
import { restablecerPassword, solicitarCodigo, verificarCodigo } from "@/servicios/auth";
import {
  enmascararEmail,
  normalizarEmail,
  validarCodigo,
  validarConfirmacion,
  validarEmail,
  validarPassword,
} from "@/lib/validaciones";

const DURACION_CODIGO = 15 * 60; // 15 minutos (REQ-001 y RNF-15)

function formatearTiempo(segundos) {
  const minutos = String(Math.floor(segundos / 60)).padStart(2, "0");
  const resto = String(segundos % 60).padStart(2, "0");
  return `${minutos}:${resto}`;
}

export default function RecuperarPasswordPage() {
  const router = useRouter();
  const { fijarLema } = usePanel();

  const [paso, setPaso] = useState("correo"); // "correo" o "codigo"
  const [correo, setCorreo] = useState("");
  const [codigo, setCodigo] = useState("");
  const [tokenRestablecimiento, setTokenRestablecimiento] = useState(""); // lo entrega el backend
  const [segundos, setSegundos] = useState(DURACION_CODIGO);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [info, setInfo] = useState("");
  const [cargando, setCargando] = useState(""); // "", "correo", "verificar", "reenviar" o "guardar"

  // Cuenta regresiva: solo corre en el paso 2.
  // Es visual: el backend es quien decide si el código sigue vigente.
  useEffect(() => {
    if (paso !== "codigo") return;
    const reloj = setInterval(() => {
      setSegundos((actual) => (actual > 0 ? actual - 1 : 0));
    }, 1000);
    return () => clearInterval(reloj);
  }, [paso]);

  const expirado = segundos === 0;
  const codigoVerificado = Boolean(tokenRestablecimiento);

  // PASO 1: pedir el código al correo
  async function pedirCodigo(evento) {
    evento.preventDefault();
    const { email } = Object.fromEntries(new FormData(evento.currentTarget));

    const error = validarEmail(email);
    setErrores({ email: error });
    setErrorGeneral("");
    if (error) return;

    const correoLimpio = normalizarEmail(email);
    setCargando("correo");
    const respuesta = await solicitarCodigo({ email: correoLimpio });
    setCargando("");

    if (!respuesta.ok) {
      setErrorGeneral(respuesta.error);
      return;
    }
    setCorreo(correoLimpio);
    setErrores({});
    setSegundos(DURACION_CODIGO);
    setPaso("codigo");
    fijarLema("Revisa tu correo.");
  }

  async function reenviarCodigo() {
    setErrores({});
    setErrorGeneral("");
    setInfo("");

    setCargando("reenviar");
    const respuesta = await solicitarCodigo({ email: correo });
    setCargando("");

    if (!respuesta.ok) {
      setErrorGeneral(respuesta.error);
      return;
    }
    setCodigo("");
    setTokenRestablecimiento("");
    setSegundos(DURACION_CODIGO);
    setInfo("Te enviamos un código nuevo. El anterior ya no sirve.");
  }

  // PASO 2A: verificar el código. Si es correcto, se muestran los campos de contraseña.
  async function verificar(evento) {
    evento.preventDefault();
    const error = validarCodigo(codigo);
    setErrores({ codigo: error });
    setErrorGeneral("");
    setInfo("");
    if (error) return;

    setCargando("verificar");
    const respuesta = await verificarCodigo({ email: correo, codigo });
    setCargando("");

    if (!respuesta.ok) {
      setErrores({ codigo: respuesta.error }); // casillas en rojo + mensaje
      return;
    }
    setTokenRestablecimiento(respuesta.datos.tokenRestablecimiento);
  }

  // PASO 2B: guardar la nueva contraseña
  async function guardar(evento) {
    evento.preventDefault();
    const datos = Object.fromEntries(new FormData(evento.currentTarget));

    const nuevosErrores = {
      password: validarPassword(datos.password),
      confirmar: validarConfirmacion(datos.password, datos.confirmar),
    };
    setErrores(nuevosErrores);
    setErrorGeneral("");
    if (Object.values(nuevosErrores).some(Boolean)) return;

    setCargando("guardar");
    const respuesta = await restablecerPassword({
      tokenRestablecimiento,
      password: datos.password,
    });
    setCargando("");

    if (!respuesta.ok) {
      if (respuesta.estado === 410) {
        // Venció el tiempo para cambiar la contraseña: hay que verificar de nuevo
        setTokenRestablecimiento("");
        setCodigo("");
      }
      setErrorGeneral(respuesta.error);
      return;
    }
    router.push("/login"); // el lema especial se descarta solo al cambiar de pantalla
  }

  return (
    <div key={paso} className="animate-aparecer motion-reduce:animate-none">
      {paso === "correo" ? (
        <>
          <p className="text-sm text-popim-muted">Recuperación de acceso</p>
          <h1 className="mt-1 text-4xl font-semibold text-popim-ink">
            Recuperar Contraseña
          </h1>
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
            <BotonPrimario cargando={cargando === "correo"}>Enviar Código</BotonPrimario>
            {errorGeneral && <Mensaje tipo="error">{errorGeneral}</Mensaje>}
            <Mensaje tipo="aviso">
              El código es de un solo uso y expira 15 minutos después de enviado, por
              seguridad.
            </Mensaje>
          </form>

          <p className="mt-8 text-center text-xs">
            ¿Recordaste tu contraseña?{" "}
            <Link href="/login" className="text-popim-primary underline">
              Iniciar Sesión.
            </Link>
          </p>
        </>
      ) : (
        <>
          <p className="text-sm text-popim-muted">Un paso más.</p>
          <h1 className="mt-1 text-4xl font-semibold text-popim-ink">
            Verifica tu identidad
          </h1>
          <p className="mt-3 max-w-sm text-base text-popim-muted">
            Enviamos un código a{" "}
            <span className="font-semibold text-popim-ink">{enmascararEmail(correo)}</span>.
            Ingrésalo a continuación.
          </p>

          {/* Bloque 1: código. Enter dentro de las casillas también verifica. */}
          <form onSubmit={verificar} noValidate className="mt-6 flex flex-col gap-3">
            <CodigoOtp
              valor={codigo}
              onChange={setCodigo}
              error={errores.codigo}
              disabled={codigoVerificado || expirado}
            />

            {codigoVerificado ? (
              <Mensaje tipo="info">Código verificado. Ahora crea tu nueva contraseña.</Mensaje>
            ) : (
              <>
                <p role="timer" className="text-center text-xs text-popim-alerta">
                  {expirado
                    ? "El código expiró. Pide uno nuevo."
                    : `Expira en ${formatearTiempo(segundos)}`}
                </p>

                <BotonPrimario
                  cargando={cargando === "verificar"}
                  disabled={expirado || cargando !== ""}
                >
                  Verificar Código
                </BotonPrimario>

                <p className="text-center text-xs">
                  ¿No te llegó el correo?{" "}
                  <button
                    type="button"
                    onClick={reenviarCodigo}
                    disabled={cargando !== ""}
                    className="text-popim-primary underline disabled:opacity-60"
                  >
                    Reenviar.
                  </button>
                </p>
              </>
            )}

            {info && <Mensaje tipo="info">{info}</Mensaje>}
            {!codigoVerificado && errorGeneral && (
              <Mensaje tipo="error">{errorGeneral}</Mensaje>
            )}
          </form>

          {/* Bloque 2: solo aparece cuando el código fue correcto */}
          {codigoVerificado && (
            <form
              onSubmit={guardar}
              noValidate
              className="mt-3 flex animate-aparecer flex-col gap-4 motion-reduce:animate-none"
            >
              <div className="flex items-center gap-3 text-[11px] text-popim-muted">
                <span className="h-px flex-1 bg-popim-muted/40" />
                luego
                <span className="h-px flex-1 bg-popim-muted/40" />
              </div>

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
              <BotonPrimario
                variante="exito"
                cargando={cargando === "guardar"}
                disabled={cargando !== ""}
              >
                Guardar Nueva Contraseña
              </BotonPrimario>
            </form>
          )}
        </>
      )}
    </div>
  );
}