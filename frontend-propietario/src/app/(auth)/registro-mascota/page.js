"use client";

//Importamos todo lo que necesitamos
import { useState } from "react";
import { useRouter } from "next/navigation";
import CampoTexto from "@/Componentes/CampoTexto";
import CampoSelect from "@/Componentes/CampoSelect";
import BotonPrimario from "@/Componentes/BotonPrimario";
import Mensaje from "@/Componentes/Mensaje";
import { registrarMascota } from "@/servicios/mascotas";
import {
  validarEdad,
  validarFechaNacimiento,
  validarObligatorio,
} from "@/lib/validaciones";

const ESPECIES = ["Canino", "Felino", "Ave", "Roedor", "Reptil", "Otro"];
const SEXOS = ["Macho", "Hembra"];

export default function RegistroMascotaPage() {
  const router = useRouter();
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [cargando, setCargando] = useState(false);

  async function enviar(evento) {
    evento.preventDefault();
    const datos = Object.fromEntries(new FormData(evento.currentTarget));

    const nuevosErrores = {
      nombre: validarObligatorio(datos.nombre, "Escribe el nombre de la mascota."),
      especie: validarObligatorio(datos.especie, "Selecciona la especie."),
      sexo: validarObligatorio(datos.sexo, "Selecciona el sexo."),
      raza: validarObligatorio(datos.raza, "Escribe la raza."),
      edad: validarEdad(datos.edad),
      fechaNacimiento: validarFechaNacimiento(datos.fechaNacimiento),
    };
    setErrores(nuevosErrores);
    setErrorGeneral("");
    if (Object.values(nuevosErrores).some(Boolean)) return;

    setCargando(true);
    const respuesta = await registrarMascota({
      nombre: datos.nombre.trim(),
      especie: datos.especie,
      sexo: datos.sexo,
      raza: datos.raza.trim(),
      edad: Number(datos.edad),
      fechaNacimiento: datos.fechaNacimiento || null,
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
        Paso obligatorio
      </p>
      <h1 className="mt-1.5 text-3xl font-bold text-popim-ink">Registra tu mascota</h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-popim-muted">
        No podrás continuar al portal sin registrar al menos una mascota a tu nombre.
      </p>

      <form onSubmit={enviar} noValidate className="mt-5 flex flex-col gap-4">
        <CampoTexto
          id="nombre"
          etiqueta="Nombre de la mascota"
          placeholder="Ej. Luna"
          error={errores.nombre}
        />

        <div className="grid grid-cols-2 gap-4">
          <CampoSelect id="especie" etiqueta="Especie" opciones={ESPECIES} error={errores.especie} />
          <CampoSelect id="sexo" etiqueta="Sexo" opciones={SEXOS} error={errores.sexo} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <CampoTexto id="raza" etiqueta="Raza" placeholder="Ej. Labrador" error={errores.raza} />
          <CampoTexto
            id="edad"
            etiqueta="Edad (años)"
            tipo="number"
            placeholder="Ej. 3"
            inputMode="numeric"
            min={0}
            error={errores.edad}
          />
        </div>

        <CampoTexto
          id="fechaNacimiento"
          etiqueta="Fecha de nacimiento (opcional)"
          tipo="date"
          obligatorio={false}
          error={errores.fechaNacimiento}
        />

        <p className="text-xs text-popim-muted">
          El sistema asignará un Código Único de mascota automáticamente al guardar.
        </p>

        {errorGeneral && <Mensaje tipo="error">{errorGeneral}</Mensaje>}
        <BotonPrimario cargando={cargando}>Registrar mascota y continuar</BotonPrimario>
      </form>

      <p className="mt-4 text-center text-xs text-popim-muted">
        No es posible acceder al portal sin completar este registro.
      </p>
    </>
  );
}