"use client";

import { useState } from "react";
import BotonPrimario from "@/Componentes/BotonPrimario";
import CampoTexto from "@/Componentes/CampoTexto";
import EncabezadoPagina from "@/Componentes/EncabezadoPagina";
import Mensaje from "@/Componentes/Mensaje";
import SelectorFoto from "@/Componentes/SelectorFoto";
import TarjetaSeccion from "@/Componentes/TarjetaSeccion";
import { useSesion } from "@/lib/sesionContexto";
import { useCarga } from "@/lib/useCarga";
import {
  cambiarPassword,
  guardarPerfil,
  obtenerPerfil,
  quitarFotoPerfil,
  subirFotoPerfil,
} from "@/servicios/perfil";
import {
  formatearCedula,
  formatearTelefono,
  normalizarTelefono,
  validarConfirmacion,
  validarObligatorio,
  validarPassword,
  validarTelefono,
} from "@/lib/validaciones";
import { formatearFecha, formatearFechaHora } from "@/lib/formato";

// ---------- Datos personales ----------
function DatosPersonales({ perfil, alGuardar }) {
  const { usuario, propietario } = perfil;
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [guardado, setGuardado] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function enviar(evento) {
    evento.preventDefault();
    const datos = Object.fromEntries(new FormData(evento.currentTarget));

    const nuevosErrores = {
      nombreCompleto: validarObligatorio(datos.nombreCompleto, "Escribe tu nombre completo."),
      telefono: datos.telefono ? validarTelefono(datos.telefono) : "",
    };
    setErrores(nuevosErrores);
    setErrorGeneral("");
    setGuardado(false);
    if (Object.values(nuevosErrores).some(Boolean)) return;

    setCargando(true);
    const respuesta = await guardarPerfil({
      nombreCompleto: datos.nombreCompleto.trim(),
      telefono: normalizarTelefono(datos.telefono ?? "") || null,
      direccion: (datos.direccion ?? "").trim() || null,
    });
    setCargando(false);

    if (!respuesta.ok) {
      if (respuesta.campo) setErrores({ [respuesta.campo]: respuesta.error });
      else setErrorGeneral(respuesta.error);
      return;
    }
    setGuardado(true);
    alGuardar({ nombreCompleto: datos.nombreCompleto.trim() });
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
      <CampoTexto
        id="nombreCompleto"
        etiqueta="Nombre completo"
        autoComplete="name"
        valorInicial={usuario.nombreCompleto}
        error={errores.nombreCompleto}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <CampoTexto
          id="telefono"
          etiqueta="Teléfono"
          tipo="tel"
          icono="telefono"
          placeholder="8888-8888"
          autoComplete="tel"
          inputMode="tel"
          maxLength={9}
          formato={formatearTelefono}
          valorInicial={formatearTelefono(usuario.telefono ?? "")}
          obligatorio={false}
          error={errores.telefono}
        />
        <CampoTexto
          id="correo"
          etiqueta="Correo electrónico"
          icono="correo"
          disabled
          valorInicial={usuario.correo ?? ""}
        />
      </div>
      <p className="-mt-2 text-xs text-popim-muted">
        El correo es tu medio de acceso. Para cambiarlo te pediremos un código de verificación.
      </p>

      <CampoTexto
        id="direccion"
        etiqueta="Dirección (opcional)"
        placeholder="Barrio, calle y referencia"
        autoComplete="street-address"
        maxLength={255}
        valorInicial={propietario.direccion ?? ""}
        obligatorio={false}
        error={errores.direccion}
      />

      <CampoTexto
        id="cedula"
        etiqueta="Cédula de identidad"
        icono="identificacion"
        disabled
        valorInicial={formatearCedula(propietario.cedula ?? "")}
        ayuda="Identifica tu perfil en toda la red de clínicas y no se puede modificar."
      />

      {guardado && <Mensaje tipo="info">Tus datos se guardaron correctamente.</Mensaje>}
      {errorGeneral && <Mensaje tipo="error">{errorGeneral}</Mensaje>}
      <div className="sm:max-w-xs">
        <BotonPrimario cargando={cargando}>Guardar cambios</BotonPrimario>
      </div>
    </form>
  );
}

// ---------- Cambiar contraseña ----------
function Seguridad() {
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [exito, setExito] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function enviar(evento) {
    evento.preventDefault();
    const formulario = evento.currentTarget; // se guarda antes del await
    const datos = Object.fromEntries(new FormData(formulario));

    const nuevosErrores = {
      passwordActual: validarObligatorio(datos.passwordActual, "Escribe tu contraseña actual."),
      passwordNueva:
        validarPassword(datos.passwordNueva) ||
        (datos.passwordNueva === datos.passwordActual
          ? "La nueva contraseña debe ser distinta a la actual."
          : ""),
      confirmar: validarConfirmacion(datos.passwordNueva, datos.confirmar),
    };
    setErrores(nuevosErrores);
    setErrorGeneral("");
    setExito(false);
    if (Object.values(nuevosErrores).some(Boolean)) return;

    setCargando(true);
    const respuesta = await cambiarPassword({
      passwordActual: datos.passwordActual,
      passwordNueva: datos.passwordNueva,
    });
    setCargando(false);

    if (!respuesta.ok) {
      if (respuesta.campo) setErrores({ [respuesta.campo]: respuesta.error });
      else setErrorGeneral(respuesta.error);
      return;
    }
    formulario.reset();
    setExito(true);
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
      <CampoTexto
        id="passwordActual"
        etiqueta="Contraseña actual"
        tipo="password"
        icono="candado"
        autoComplete="current-password"
        error={errores.passwordActual}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <CampoTexto
          id="passwordNueva"
          etiqueta="Nueva contraseña"
          tipo="password"
          icono="candado"
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
          error={errores.passwordNueva}
        />
        <CampoTexto
          id="confirmar"
          etiqueta="Confirmar contraseña"
          tipo="password"
          icono="candado"
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
          error={errores.confirmar}
        />
      </div>

      {exito && <Mensaje tipo="info">Tu contraseña se actualizó correctamente.</Mensaje>}
      {errorGeneral && <Mensaje tipo="error">{errorGeneral}</Mensaje>}
      <div className="sm:max-w-xs">
        <BotonPrimario cargando={cargando}>Cambiar contraseña</BotonPrimario>
      </div>
    </form>
  );
}

// ---------- Página ----------
export default function MiPerfilPage() {
  const { datos, error } = useCarga(obtenerPerfil, null);
  const { actualizarUsuario } = useSesion();
  const [fotoLocal, setFotoLocal] = useState(undefined);

  if (error) return <Mensaje tipo="error">{error}</Mensaje>;
  if (!datos) {
    return <div role="status" aria-label="Cargando" className="h-64 animate-pulse rounded-2xl border border-popim-linea bg-white" />;
  }

  const { usuario } = datos;
  const fotoUrl = fotoLocal !== undefined ? fotoLocal : usuario.fotoPerfilUrl;

  async function subirFoto(archivo) {
    const respuesta = await subirFotoPerfil(archivo);
    if (respuesta.ok) {
      setFotoLocal(respuesta.datos.url);
      actualizarUsuario({ fotoPerfilUrl: respuesta.datos.url });
    }
    return respuesta;
  }

  async function quitarFoto() {
    const respuesta = await quitarFotoPerfil();
    if (respuesta.ok) {
      setFotoLocal(null);
      actualizarUsuario({ fotoPerfilUrl: null });
    }
    return respuesta;
  }

  const filasCuenta = [
    ["Rol", "Propietario"],
    ["Estado", usuario.estado.nombre],
    ["Miembro desde", formatearFecha(usuario.fechaRegistro.slice(0, 10))],
    ["Último acceso", usuario.ultimoAcceso ? formatearFechaHora(usuario.ultimoAcceso) : "Primer acceso"],
  ];

  return (
    <>
      <EncabezadoPagina
        etiqueta="Tu espacio"
        titulo="Mi perfil"
        descripcion="Administra tu foto, tus datos de contacto y tu contraseña."
      />

      <div className="mt-6 grid gap-5 lg:grid-cols-[20rem_1fr]">
        <div className="space-y-5">
          <TarjetaSeccion titulo="Foto de perfil">
            <SelectorFoto
              nombre={usuario.nombreCompleto}
              fotoUrl={fotoUrl}
              tamano={88}
              onSubir={subirFoto}
              onQuitar={quitarFoto}
            />
          </TarjetaSeccion>

          <TarjetaSeccion titulo="Tu cuenta">
            <dl className="divide-y divide-popim-linea text-sm">
              {filasCuenta.map(([etiqueta, valor]) => (
                <div key={etiqueta} className="flex justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
                  <dt className="text-popim-etiqueta">{etiqueta}</dt>
                  <dd className="text-right font-medium text-popim-ink">{valor}</dd>
                </div>
              ))}
            </dl>
          </TarjetaSeccion>
        </div>

        <div className="space-y-5">
          <TarjetaSeccion titulo="Datos personales">
            <DatosPersonales perfil={datos} alGuardar={actualizarUsuario} />
          </TarjetaSeccion>
          <TarjetaSeccion titulo="Seguridad">
            <Seguridad />
          </TarjetaSeccion>
        </div>
      </div>
    </>
  );
}