//

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CampoTexto from "@/Componentes/CampoTexto";
import BotonPrimario from "@/Componentes/BotonPrimario";
import Mensaje from "@/Componentes/Mensaje";
import {
  formatearCedula,
  normalizarCedula,
  normalizarEmail,
  validarCedula,
  validarEmail,
  validarObligatorio,
  validarPassword,
  validarTelefono,
  normalizarTelefono,
  formatearTelefono
} from "@/lib/validaciones";
import PanelCodigo from "@/Componentes/PanelCodigo";
import { activarCuenta, buscarPerfilPendiente, registrarPropietario, verificarActivacion } from "@/servicios/auth";
import { guardarAviso } from "@/lib/aviso";

// El backend llama "correo" a lo que este formulario llama "email"
const NOMBRES_CAMPOS = { correo: "email" };

export default function RegistroPage() {
  const router = useRouter();
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [cargando, setCargando] = useState(false);
  // dentro del componente, junto a los otros useState:
  const [paso, setPaso] = useState("formulario"); // "formulario" o "codigo"
  const [correo, setCorreo] = useState("");
  const [tokenActivacion, setTokenActivacion] = useState("");
  const [correoEnmascarado, setCorreoEnmascarado] = useState("");

  async function enviar(evento) {
    evento.preventDefault();
    const datos = Object.fromEntries(new FormData(evento.currentTarget));

    const nuevosErrores = {
      nombre: validarObligatorio(datos.nombre, "Escribe tu nombre completo."),
      email: validarEmail(datos.email),
      cedula: validarCedula(datos.cedula),
      password: validarPassword(datos.password),
      telefono: validarTelefono(datos.telefono),
    };
    setErrores(nuevosErrores);
    setErrorGeneral("");
    if (Object.values(nuevosErrores).some(Boolean)) return;

    setCargando(true);
    const respuesta = await registrarPropietario({
      nombre: datos.nombre.trim(),
      email: normalizarEmail(datos.email),
      cedula: normalizarCedula(datos.cedula),
      password: datos.password,
      telefono: normalizarTelefono(datos.telefono),
    });
    setCargando(false);

      if (!respuesta.ok) {
      // Si el backend dice qué campo falló (correo o cédula repetidos), se marca ese input
      const campo = NOMBRES_CAMPOS[respuesta.campo] ?? respuesta.campo;
      if (campo in nuevosErrores) setErrores({ [campo]: respuesta.error });
      else setErrorGeneral(respuesta.error);
      return;
    }

    setCorreo(normalizarEmail(datos.email));
    setTokenActivacion(respuesta.datos.tokenActivacion);
    setCorreoEnmascarado(respuesta.datos.correoEnmascarado);
    setPaso("codigo");
  } // <- aquí se cierra enviar()

  async function reenviar() {
    const respuesta = await buscarPerfilPendiente({ identificador: correo });
    if (respuesta.ok) setTokenActivacion(respuesta.datos.tokenActivacion);
    return respuesta;
  }

  async function verificar(codigo) {
  const verificada = await verificarActivacion({ tokenActivacion, codigo });
  if (!verificada.ok) return verificada;

  // Ya trae contraseña (la escribió al registrarse): solo se confirma
  const activada = await activarCuenta({ tokenConfirmacion: verificada.datos.tokenConfirmacion });
   if (activada.ok) {
    guardarAviso("¡Cuenta creada con éxito!");
    router.push(activada.datos.sesionIniciada ? "/registro-mascota" : "/login");
  }
  return activada;
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

  return (
    <>
      <p className="text-sm text-popim-muted">Nuevo en POPIM</p>
      <h1 className="mt-1 text-4xl font-semibold text-popim-ink">Crear Cuenta.</h1>
      <p className="mt-3 text-base text-popim-muted">
        Estos datos identificarán tu perfil en toda la red de clínicas.
      </p>

      <form onSubmit={enviar} noValidate className="mt-6 flex flex-col gap-4">
        <CampoTexto id="nombre" etiqueta="Nombre Completo" autoComplete="name" icono="Persona" error={errores.nombre} />
        <CampoTexto id="email" etiqueta="Correo Electronico" tipo="email" placeholder="Ejemplo@popim.com" autoComplete="email" icono="Iconcorreo" error={errores.email} />
        <CampoTexto id="telefono" etiqueta="Teléfono"  tipo="tel" placeholder="8888-8888" autoComplete="tel" inputMode="tel" maxLength={9} icono="telefono" formato={formatearTelefono}  error={errores.telefono} />
        <CampoTexto id="cedula" etiqueta="Cédula de identidad" placeholder="001-010102-1000X"  formato={formatearCedula} maxLength={16} autoComplete="off" icono="Identificación" error={errores.cedula} />
        <CampoTexto
          id="password"
          etiqueta="Contraseña"
          tipo="password"
          placeholder="Mínimo 8 caracteres"
          icono= "candado"
          autoComplete="new-password"
          error={errores.password}
        />

        {errorGeneral && <Mensaje tipo="error">{errorGeneral}</Mensaje>}
        <BotonPrimario cargando={cargando}>Crear Cuenta</BotonPrimario>
      </form>

      <p className="mt-5 text-center text-xs">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-popim-primary underline">
          Iniciar Sesión.
        </Link>
      </p>
    </>
  );
}