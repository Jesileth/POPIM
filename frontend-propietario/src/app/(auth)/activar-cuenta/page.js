"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CampoTexto from "@/Componentes/CampoTexto";
import BotonPrimario from "@/Componentes/BotonPrimario";
import Mensaje from "@/Componentes/Mensaje";
import PanelCodigo from "@/Componentes/PanelCodigo";
import { activarCuenta, buscarPerfilPendiente, verificarActivacion } from "@/servicios/auth";
import {
  validarConfirmacion,
  validarObligatorio,
  validarPassword,
} from "@/lib/validaciones";
import { guardarAviso } from "@/lib/aviso";


export default function ActivarCuentaPage() {
  const router = useRouter();
  const [paso, setPaso] = useState("buscar"); // "buscar", "codigo" o "contrasena"
  const [identificador, setIdentificador] = useState("");
  const [tokenActivacion, setTokenActivacion] = useState(""); // prueba de que se pidió el código
  const [tokenConfirmacion, setTokenConfirmacion] = useState(""); // prueba de que el código fue correcto
  const [correoEnmascarado, setCorreoEnmascarado] = useState("");
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [cargando, setCargando] = useState(""); // "", "buscar" o "activar"

  // PASO 1: buscar el perfil. El backend envía el código al correo registrado.
  async function buscarPerfil(evento) {
    evento.preventDefault();
    const { identificador: escrito } = Object.fromEntries(new FormData(evento.currentTarget));
    const error = validarObligatorio(escrito, "Escribe tu correo o tu cédula.");
    setErrores({ identificador: error });
    setErrorGeneral("");
    if (error) return;

    setCargando("buscar");
    const respuesta = await buscarPerfilPendiente({ identificador: escrito.trim() });
    setCargando("");

    if (!respuesta.ok) {
      setErrorGeneral(respuesta.error);
      return;
    }
    setIdentificador(escrito.trim());
    setTokenActivacion(respuesta.datos.tokenActivacion);
    setCorreoEnmascarado(respuesta.datos.correoEnmascarado);
    setPaso("codigo");
  }

  // Reenviar = volver a buscar. El backend invalida el código anterior.
  async function reenviar() {
    const respuesta = await buscarPerfilPendiente({ identificador });
    if (respuesta.ok) setTokenActivacion(respuesta.datos.tokenActivacion);
    return respuesta;
  }

  // PASO 2: verificar el código
  async function verificar(codigo) {
    const respuesta = await verificarActivacion({ tokenActivacion, codigo });
    if (!respuesta.ok) return respuesta;

    if (respuesta.datos.requiereContrasena) {
      setTokenConfirmacion(respuesta.datos.tokenConfirmacion);
      setPaso("contrasena");
      return respuesta;
    }
    // La cuenta ya tenía contraseña (se registró sola): solo faltaba confirmar el correo
    return confirmar(respuesta.datos.tokenConfirmacion);
  }

  async function confirmar(token, password) {
    const respuesta = await activarCuenta({ tokenConfirmacion: token, password });
    if (respuesta.ok) {
    guardarAviso("¡Cuenta activada con éxito!");
    router.push(respuesta.datos.sesionIniciada ? "/mis-mascotas" : "/login");
  }
  return respuesta;
  }

  // PASO 3: crear la contraseña
  async function activar(evento) {
    evento.preventDefault();
    const datos = Object.fromEntries(new FormData(evento.currentTarget));

    const nuevosErrores = {
      password: validarPassword(datos.password),
      confirmar: validarConfirmacion(datos.password, datos.confirmar),
    };
    setErrores(nuevosErrores);
    setErrorGeneral("");
    if (Object.values(nuevosErrores).some(Boolean)) return;

    setCargando("activar");
    const respuesta = await confirmar(tokenConfirmacion, datos.password);
    setCargando("");

    if (!respuesta.ok) {
      if (respuesta.estado === 410) {
        // Se acabó el tiempo para crear la contraseña: hay que empezar de nuevo
        setTokenConfirmacion("");
        setTokenActivacion("");
        setPaso("buscar");
      }
      setErrorGeneral(respuesta.error);
    }
  }

  if (paso === "codigo") {
    return (
      <PanelCodigo
        correoEnmascarado={correoEnmascarado}
        onVerificar={verificar}
        onReenviar={reenviar}
      />
    );
  }

  if (paso === "contrasena") {
    return (
      <div className="animate-aparecer motion-reduce:animate-none">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-popim-primary">
          Correo confirmado
        </p>
        <h1 className="mt-1.5 text-3xl font-bold text-popim-ink">Crea tu contraseña</h1>

        <form onSubmit={activar} noValidate className="mt-5 flex flex-col gap-4">
          <Mensaje tipo="info" className="text-justify">
            Código verificado. Ahora crea tu contraseña.
          </Mensaje>
          <CampoTexto
            id="password"
            etiqueta="Nueva contraseña"
            tipo="password"
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
            icono="candado"
            error={errores.password}
          />
          <CampoTexto
            id="confirmar"
            etiqueta="Confirmar contraseña"
            tipo="password"
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
            icono="candado"
            error={errores.confirmar}
          />

          {errorGeneral && <Mensaje tipo="error">{errorGeneral}</Mensaje>}
          <BotonPrimario cargando={cargando === "activar"} disabled={cargando !== ""}>
            Activar cuenta
          </BotonPrimario>
        </form>
      </div>
    );
  }

  return (
    <>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-popim-primary">
        Primer ingreso
      </p>
      <h1 className="mt-1.5 text-3xl font-bold text-popim-ink">Activar mi cuenta</h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-popim-muted">
        Busca tu perfil con el correo o cédula que diste en la clínica. Te enviaremos un código
        al correo registrado.
      </p>

      <form onSubmit={buscarPerfil} noValidate className="mt-5 flex flex-col gap-4">
        <CampoTexto
          id="identificador"
          etiqueta="Correo electrónico o cédula de identidad"
          placeholder="Tu correo o tu cédula"
          icono="Iconcorreo"
          error={errores.identificador}
        />

        {errorGeneral && <Mensaje tipo="error">{errorGeneral}</Mensaje>}
        <BotonPrimario cargando={cargando === "buscar"} disabled={cargando !== ""}>
          Buscar mi perfil
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