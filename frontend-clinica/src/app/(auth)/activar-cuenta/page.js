"use client";

// Activar cuenta del PERSONAL de la clínica (recepción, veterinario, administrador).
//
// ¿Quién manda el código? NADIE a mano.
//   1. El administrador registra a la persona con su correo → la cuenta nace PENDIENTE (101),
//      sin contraseña. El administrador no ve ni envía ningún código.
//   2. La persona entra aquí, escribe SU correo y toca "Enviar código".
//   3. El backend busca una cuenta pendiente con ese correo; si existe, crea un código
//      de 6 dígitos (15 min) en tokens_verificacion y lo manda a ESE correo.
//      Responde siempre lo mismo, exista o no (así nadie averigua qué correos hay).
//
// La pantalla es una sola página con un estado "paso":
//   "correo"   → pide el correo y solicita el código
//   "codigo"   → 6 cajitas; el backend revisa el código SIN gastarlo y devuelve
//                un tokenConfirmacion + nombre, rol y clínica
//   "password" → crea su contraseña (se manda con el tokenConfirmacion)
//   "listo"    → cuenta activa (102)

import { useState } from "react";
import Link from "next/link";
import CampoTexto from "@/Componentes/campos/CampoTexto";
import CampoCodigo from "@/Componentes/campos/CampoCodigo";
import BotonPrimario from "@/Componentes/campos/BotonPrimario";
import Mensaje from "@/Componentes/Mensaje";
import { IconArrowLeft, IconCheckCircle, IconPersonBadge } from "@/Componentes/Iconos";
import { usePanel } from "@/lib/panelContexto";
import {
  MIN_PASSWORD,
  enmascararEmail,
  normalizarEmail,
  validarCodigo,
  validarConfirmacion,
  validarEmail,
  validarPassword,
} from "@/lib/validaciones";
import { activarCuenta, solicitarCodigoActivacion, verificarActivacion } from "@/servicios/auth";

const NOMBRES_ROL = {
  RECEPCIONISTA: "Recepcionista",
  VETERINARIO: "Veterinario",
  ADMINISTRADOR: "Administrador",
};

// Para la rayita de arriba y el "Paso X de 3"
const NUMERO_PASO = { correo: 1, codigo: 2, password: 3 };

export default function ActivarCuentaPage() {
  const { fijarLema } = usePanel();
  const [paso, setPaso] = useState("correo");
  const [correo, setCorreo] = useState("");
  const [codigo, setCodigo] = useState(""); // las 6 cajitas son "controladas": el valor vive aquí
  const [cuenta, setCuenta] = useState(null); // { tokenConfirmacion, nombre, rol, clinica }
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [aviso, setAviso] = useState("");
  const [cargando, setCargando] = useState(false);

  // Limpia mensajes al cambiar de paso
  function irA(nuevoPaso) {
    setErrores({});
    setErrorGeneral("");
    // El campo de correo se vuelve a dibujar vacío, así que el estado también se vacía
    if (nuevoPaso === "correo") setCorreo("");
    setPaso(nuevoPaso);
  }

  // ---------- Paso 1: pedir el código ----------
  async function enviarCodigo(evento) {
    evento?.preventDefault();
    const error = validarEmail(correo);
    setErrores({ correo: error });
    setErrorGeneral("");
    if (error) return;

    setCargando(true);
    const respuesta = await solicitarCodigoActivacion({
      correo: normalizarEmail(correo),
      portal: "CLINICA",
    });
    setCargando(false);

    if (!respuesta.ok) {
      setErrorGeneral(respuesta.error);
      return;
    }
    setCodigo("");
    setAviso(`Si ${enmascararEmail(correo)} tiene una cuenta pendiente, te enviamos un código. Vence en 15 minutos.`);
    irA("codigo");
  }

  // ---------- Paso 2: revisar el código ----------
  async function verificar(evento) {
    evento.preventDefault();
    const error = validarCodigo(codigo);
    setErrores({ codigo: error });
    setErrorGeneral("");
    if (error) return;

    setCargando(true);
    const respuesta = await verificarActivacion({ correo: normalizarEmail(correo), codigo });
    setCargando(false);

    if (!respuesta.ok) {
      setErrorGeneral(respuesta.error);
      setCodigo(""); // vacía las cajitas para que lo escriba otra vez
      return;
    }
    setCuenta(respuesta.datos);
    setAviso("");
    fijarLema(["Hola,", `${respuesta.datos.nombre.split(" ")[0]}.`]);
    irA("password");
  }

  // ---------- Paso 3: crear contraseña ----------
  async function crearPassword(evento) {
    evento.preventDefault();
    const datos = Object.fromEntries(new FormData(evento.currentTarget));
    const nuevos = {
      password: validarPassword(datos.password),
      confirmar: validarConfirmacion(datos.password, datos.confirmar),
    };
    setErrores(nuevos);
    setErrorGeneral("");
    if (Object.values(nuevos).some(Boolean)) return;

    setCargando(true);
    const respuesta = await activarCuenta({
      tokenConfirmacion: cuenta.tokenConfirmacion,
      password: datos.password,
    });
    setCargando(false);

    if (!respuesta.ok) {
      setErrorGeneral(respuesta.error);
      return;
    }
    fijarLema(["Bienvenido", "al equipo."]);
    irA("listo");
  }

  // ---------- Listo ----------
  if (paso === "listo") {
    return (
      <div className="text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-popim-exito/15">
          <IconCheckCircle size={32} className="text-popim-exito" />
        </span>
        <h1 className="mt-5 text-[28px] font-extrabold text-popim-ink">Tu cuenta está activa</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-popim-texto">
          Ya puedes entrar con{" "}
          <span className="font-semibold text-popim-ink">{normalizarEmail(correo)}</span> y la
          contraseña que acabas de crear.
        </p>
        <div className="mt-6">
          <Link
            href="/login"
            className="flex h-11 w-full items-center justify-center rounded-xl bg-popim-primary font-semibold text-white shadow-lg shadow-popim-primary/25 transition hover:bg-popim-primary-dark"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  const numero = NUMERO_PASO[paso];

  return (
    <>
      {/* En el paso 1 vuelve al login; en los demás, al paso anterior */}
      {paso === "correo" ? (
        <Link
          href="/login"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-popim-primary hover:underline"
        >
          <IconArrowLeft size={16} />
          Volver a iniciar sesión
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => irA(paso === "codigo" ? "correo" : "codigo")}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-popim-primary hover:underline"
        >
          <IconArrowLeft size={16} />
          {paso === "codigo" ? "Cambiar correo" : "Volver"}
        </button>
      )}

      {/* Tres rayitas: se pintan de azul las que ya se pasaron */}
      <div className="mb-4 flex gap-1.5" aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={`h-1.5 w-10 rounded-full ${n <= numero ? "bg-popim-primary" : "bg-popim-linea"}`}
          />
        ))}
      </div>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-popim-primary">
        Paso {numero} de 3
      </p>

      {/* ---------- Paso 1 ---------- */}
      {paso === "correo" && (
        <>
          <h1 className="mt-1.5 text-[32px] font-extrabold text-popim-ink">Activa tu cuenta</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-popim-texto">
            Escribe el correo con el que te registró tu clínica. Te enviaremos un código de 6
            dígitos.
          </p>

          <form onSubmit={enviarCodigo} noValidate className="mt-6 flex flex-col gap-4">
            {/* CampoTexto no es controlado, por eso guardamos el correo con onInput */}
            <div onInput={(evento) => setCorreo(evento.target.value)}>
              <CampoTexto
                id="correo"
                etiqueta="Correo electrónico"
                tipo="email"
                placeholder="nombre@clinica.com"
                autoComplete="email"
                icono="Iconcorreo"
                error={errores.correo}
              />
            </div>

            {errorGeneral && <Mensaje tipo="error">{errorGeneral}</Mensaje>}

            <div className="pt-1">
              <BotonPrimario cargando={cargando}>Enviar código</BotonPrimario>
            </div>
          </form>
        </>
      )}

      {/* ---------- Paso 2 ---------- */}
      {paso === "codigo" && (
        <>
          <h1 className="mt-1.5 text-[32px] font-extrabold text-popim-ink">Revisa tu correo</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-popim-texto">
            Escribe el código que enviamos a{" "}
            <span className="font-semibold text-popim-ink">{enmascararEmail(correo)}</span>.
          </p>

          <form onSubmit={verificar} noValidate className="mt-6 flex flex-col gap-4">
            <CampoCodigo valor={codigo} alCambiar={setCodigo} error={errores.codigo} />

            <p className="text-sm text-popim-texto">
              ¿No te llegó? Revisa la carpeta de spam o{" "}
              <button
                type="button"
                onClick={() => enviarCodigo()}
                disabled={cargando}
                className="font-semibold text-popim-primary hover:underline disabled:opacity-60"
              >
                envía otro código
              </button>
            </p>

            {aviso && <Mensaje>{aviso}</Mensaje>}
            {errorGeneral && <Mensaje tipo="error">{errorGeneral}</Mensaje>}

            <div className="pt-1">
              <BotonPrimario cargando={cargando} disabled={codigo.length < 6}>
                Verificar código
              </BotonPrimario>
            </div>
          </form>
        </>
      )}

      {/* ---------- Paso 3 ---------- */}
      {paso === "password" && (
        <>
          <h1 className="mt-1.5 text-[32px] font-extrabold text-popim-ink">Crea tu contraseña</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-popim-texto">
            Con ella entrarás al portal de tu clínica.
          </p>

          {/* Quién es: confirma que es SU cuenta antes de ponerle contraseña */}
          <div className="mt-5 flex items-center gap-3 rounded-xl border border-popim-linea bg-popim-campo px-4 py-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-popim-info text-popim-primary">
              <IconPersonBadge size={20} />
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-popim-ink">{cuenta.nombre}</p>
              <p className="truncate text-sm text-popim-texto">
                {NOMBRES_ROL[cuenta.rol] ?? cuenta.rol} · {cuenta.clinica}
              </p>
            </div>
          </div>

          <form onSubmit={crearPassword} noValidate className="mt-5 flex flex-col gap-4">
            <CampoTexto
              id="password"
              etiqueta="Contraseña nueva"
              tipo="password"
              placeholder={`Mínimo ${MIN_PASSWORD} caracteres`}
              autoComplete="new-password"
              icono="candado"
              error={errores.password}
            />
            <CampoTexto
              id="confirmar"
              etiqueta="Confirmar contraseña"
              tipo="password"
              placeholder="Escríbela otra vez"
              autoComplete="new-password"
              icono="candado"
              error={errores.confirmar}
            />

            {errorGeneral && <Mensaje tipo="error">{errorGeneral}</Mensaje>}

            <div className="pt-1">
              <BotonPrimario cargando={cargando}>Activar cuenta</BotonPrimario>
            </div>
          </form>
        </>
      )}
    </>
  );
}