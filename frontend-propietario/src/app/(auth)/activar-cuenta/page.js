"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CampoTexto from "@/Componentes/CampoTexto";
import BotonPrimario from "@/Componentes/BotonPrimario";
import Mensaje from "@/Componentes/Mensaje";
import { activarCuenta, buscarPerfilPendiente } from "@/servicios/auth";
import {
  validarConfirmacion,
  validarObligatorio,
  validarPassword,
} from "@/lib/validaciones";

export default function ActivarCuentaPage() {
  const router = useRouter();
  const formulario = useRef(null);
  const [tokenActivacion, setTokenActivacion] = useState(""); // lo entrega el backend
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [cargando, setCargando] = useState(""); // "", "buscar" o "activar"

  const perfilEncontrado = Boolean(tokenActivacion);

  async function buscarPerfil() {
    const { identificador } = Object.fromEntries(new FormData(formulario.current));
    const error = validarObligatorio(identificador, "Escribe tu correo o tu cédula.");
    setErrores({ identificador: error });
    setErrorGeneral("");
    if (error) return;

    setCargando("buscar");
    const respuesta = await buscarPerfilPendiente({ identificador: identificador.trim() });
    setCargando("");

    if (!respuesta.ok) {
      setErrorGeneral(respuesta.error);
      return;
    }
    setTokenActivacion(respuesta.datos.tokenActivacion);
  }

  async function activar(evento) {
    evento.preventDefault();
    if (!perfilEncontrado) return;
    const datos = Object.fromEntries(new FormData(evento.currentTarget));

    const nuevosErrores = {
      password: validarPassword(datos.password),
      confirmar: validarConfirmacion(datos.password, datos.confirmar),
    };
    setErrores(nuevosErrores);
    setErrorGeneral("");
    if (Object.values(nuevosErrores).some(Boolean)) return;

    setCargando("activar");
    const respuesta = await activarCuenta({ tokenActivacion, password: datos.password });
    setCargando("");

    if (!respuesta.ok) {
      if (respuesta.estado === 410) setTokenActivacion(""); // el token venció: hay que buscar de nuevo
      setErrorGeneral(respuesta.error);
      return;
    }
    router.push("/login");
  }

  return (
    <>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-popim-primary">
        Primer ingreso
      </p>
      <h1 className="mt-1.5 text-3xl font-bold text-popim-ink">Activar mi cuenta</h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-popim-muted">
        Busca tu perfil con el correo o cédula que diste en la clínica.
      </p>

      <form
        ref={formulario}
        onSubmit={activar}
        noValidate
        className="mt-5 flex flex-col gap-4"
      >
        <CampoTexto
          id="identificador"
          etiqueta="Correo electrónico o cédula de identidad"
          placeholder="Tu correo o tu cédula"
          icono="Iconcorreo"
          disabled={perfilEncontrado}
          error={errores.identificador}
        />
        <BotonPrimario
          type="button"
          variante="secundario"
          onClick={buscarPerfil}
          cargando={cargando === "buscar"}
          disabled={perfilEncontrado || cargando !== ""}
        >
          Buscar mi perfil
        </BotonPrimario>

        {/* Divisor con etiqueta */}
        <div className="flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.15em] text-popim-etiqueta">
          <span className="h-px flex-1 bg-popim-linea" />
          Crear contraseña
          <span className="h-px flex-1 bg-popim-linea" />
        </div>

        {perfilEncontrado && (
          <Mensaje tipo="info" className="text-justify">Perfil encontrado. Ahora crea tu contraseña.</Mensaje>
        )}

        <CampoTexto
          id="password"
          etiqueta="Nueva contraseña"
          tipo="password"
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
          icono="candado"
          disabled={!perfilEncontrado}
          error={errores.password}
        />
        <CampoTexto
          id="confirmar"
          etiqueta="Confirmar contraseña"
          tipo="password"
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
          icono="candado"
          disabled={!perfilEncontrado}
          error={errores.confirmar}
        />

        {errorGeneral && <Mensaje tipo="error">{errorGeneral}</Mensaje>}
        <BotonPrimario
          cargando={cargando === "activar"}
          disabled={!perfilEncontrado || cargando !== ""}
        >
          Activar cuenta
        </BotonPrimario>
      </form>

      <p className="mt-4 text-center text-sm text-popim-muted">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-semibold text-popim-primary hover:underline">
          Iniciar sesión
        </Link>
      </p>
    </>
  );
}