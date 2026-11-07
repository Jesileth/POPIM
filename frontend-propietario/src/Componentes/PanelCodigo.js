
//

"use client";

import { useEffect, useState } from "react";
import CodigoOtp from "@/Componentes/CodigoOtp";
import BotonPrimario from "@/Componentes/BotonPrimario";
import Mensaje from "@/Componentes/Mensaje";
import { validarCodigo } from "@/lib/validaciones";

const DURACION_CODIGO = 15 * 60; // 15 minutos, igual que en el backend

function formatearTiempo(segundos) {
  const minutos = String(Math.floor(segundos / 60)).padStart(2, "0");
  const resto = String(segundos % 60).padStart(2, "0");
  return `${minutos}:${resto}`;
}

// onVerificar(codigo) y onReenviar() deben devolver la respuesta del servicio: { ok, error, ... }
export default function PanelCodigo({ correoEnmascarado, onVerificar, onReenviar }) {
  const [codigo, setCodigo] = useState("");
  const [segundos, setSegundos] = useState(DURACION_CODIGO);
  const [errorCodigo, setErrorCodigo] = useState("");
  const [errorGeneral, setErrorGeneral] = useState("");
  const [info, setInfo] = useState("");
  const [cargando, setCargando] = useState(""); // "", "verificar" o "reenviar"

  // Cuenta regresiva solo visual: el backend decide si el código sigue vigente
  useEffect(() => {
    const reloj = setInterval(() => {
      setSegundos((actual) => (actual > 0 ? actual - 1 : 0));
    }, 1000);
    return () => clearInterval(reloj);
  }, []);

  const expirado = segundos === 0;

  async function verificar(evento) {
    evento.preventDefault();
    const error = validarCodigo(codigo);
    setErrorCodigo(error);
    setErrorGeneral("");
    setInfo("");
    if (error) return;

    setCargando("verificar");
    const respuesta = await onVerificar(codigo);
    setCargando("");

    // Si salió bien, la página que usa este panel cambia de paso y este panel desaparece
    if (!respuesta.ok) setErrorCodigo(respuesta.error);
  }

  async function reenviar() {
    setErrorCodigo("");
    setErrorGeneral("");
    setInfo("");

    setCargando("reenviar");
    const respuesta = await onReenviar();
    setCargando("");

    if (!respuesta.ok) {
      setErrorGeneral(respuesta.error);
      return;
    }
    setCodigo("");
    setSegundos(DURACION_CODIGO);
    setInfo("Te enviamos un código nuevo. El anterior ya no sirve.");
  }

  return (
    <div className="animate-aparecer motion-reduce:animate-none">
      <p className="text-sm text-popim-muted">Un paso más.</p>
      <h1 className="mt-1 text-4xl font-semibold text-popim-ink">Confirma tu correo</h1>
      <p className="mt-3 max-w-sm text-base text-popim-muted">
        Enviamos un código a{" "}
        <span className="font-semibold text-popim-ink">{correoEnmascarado}</span>.
        Ingrésalo a continuación.
      </p>

      <form onSubmit={verificar} noValidate className="mt-6 flex flex-col gap-3">
        <CodigoOtp
          valor={codigo}
          onChange={setCodigo}
          error={errorCodigo}
          disabled={expirado || cargando !== ""}
        />

        <p role="timer" className="text-center text-xs text-popim-alerta">
          {expirado ? "El código expiró. Pide uno nuevo." : `Expira en ${formatearTiempo(segundos)}`}
        </p>

        <BotonPrimario cargando={cargando === "verificar"} disabled={expirado || cargando !== ""}>
          Verificar Código
        </BotonPrimario>

        <p className="text-center text-xs">
          ¿No te llegó el correo?{" "}
          <button
            type="button"
            onClick={reenviar}
            disabled={cargando !== ""}
            className="text-popim-primary underline disabled:opacity-60"
          >
            Reenviar.
          </button>
        </p>

        {info && <Mensaje tipo="info">{info}</Mensaje>}
        {errorGeneral && <Mensaje tipo="error">{errorGeneral}</Mensaje>}
      </form>
    </div>
  );
}