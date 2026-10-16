//

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CampoTexto from "@/Componentes/CampoTexto";
import BotonPrimario from "@/Componentes/BotonPrimario";
import Mensaje from "@/Componentes/Mensaje";
import { registrarPropietario } from "@/servicios/auth";
import {
  formatearCedula,
  normalizarCedula,
  normalizarEmail,
  validarCedula,
  validarEmail,
  validarObligatorio,
  validarPassword,
} from "@/lib/validaciones";

export default function RegistroPage() {
  const router = useRouter();
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [cargando, setCargando] = useState(false);

  async function enviar(evento) {
    evento.preventDefault();
    const datos = Object.fromEntries(new FormData(evento.currentTarget));

    const nuevosErrores = {
      nombre: validarObligatorio(datos.nombre, "Escribe tu nombre completo."),
      email: validarEmail(datos.email),
      cedula: validarCedula(datos.cedula),
      password: validarPassword(datos.password),
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
    });
    setCargando(false);

    if (!respuesta.ok) {
      // Si el backend dice qué campo falló (correo o cédula repetidos), se marca ese input
      if (respuesta.campo) setErrores({ [respuesta.campo]: respuesta.error });
      else setErrorGeneral(respuesta.error);
      return;
    }
    router.push("/registro-mascota");
  }

  return (
    <>
      <p className="text-sm text-popim-muted">Nuevo en POPIM</p>
      <h1 className="mt-1 text-4xl font-semibold text-popim-ink">Crear Cuenta.</h1>
      <p className="mt-3 text-base text-popim-muted">
        Estos datos identificarán tu perfil en toda la red de clínicas.
      </p>

      <form onSubmit={enviar} noValidate className="mt-6 flex flex-col gap-4">
        <CampoTexto id="nombre" etiqueta="Nombre Completo" autoComplete="name" error={errores.nombre} />
        <CampoTexto id="email" etiqueta="Correo Electronico" tipo="email" placeholder="Ejemplo@popim.com" autoComplete="email" error={errores.email} />
        <CampoTexto id="cedula" etiqueta="Cédula de identidad" placeholder="001-010102-1000X"  formato={formatearCedula} maxLength={16} autoComplete="off" error={errores.cedula} />
        <CampoTexto
          id="password"
          etiqueta="Contraseña"
          tipo="password"
          placeholder="Mínimo 8 caracteres"
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