"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import CampoTexto from "@/Componentes/CampoTexto";
import CampoSelect from "@/Componentes/CampoSelect";
import CampoEdad from "@/Componentes/CampoEdad";
import BotonPrimario from "@/Componentes/BotonPrimario";
import Mensaje from "@/Componentes/Mensaje";
import { obtenerEspecies, obtenerRazas } from "@/servicios/catalogos";
import { registrarMascota } from "@/servicios/mascotas";
import {
  validarEdad,
  validarFechaNacimiento,
  validarObligatorio,
} from "@/lib/validaciones";

const SEXOS = [
  { valor: "MACHO", texto: "Macho" },
  { valor: "HEMBRA", texto: "Hembra" },
];

export default function RegistroMascotaPage() {
  const router = useRouter();
  const [especies, setEspecies] = useState([]);
  const [especieId, setEspecieId] = useState("");
  const [razas, setRazas] = useState([]);
  const [cargandoRazas, setCargandoRazas] = useState(false);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [cargando, setCargando] = useState(false);
  const especieActual = useRef("");

  // Al abrir la pantalla: cargar las especies del catálogo
  useEffect(() => {
    let activo = true;
    obtenerEspecies().then((respuesta) => {
      if (!activo) return;
      if (respuesta.ok) setEspecies(respuesta.datos.especies);
      else setErrorGeneral(respuesta.error);
    });
    return () => {
      activo = false;
    };
  }, []);

  // Al elegir una especie: cargar sus razas
  async function alCambiarEspecie(evento) {
    const id = evento.target.value;
    especieActual.current = id;
    setEspecieId(id);
    setRazas([]);
    setErrores((previos) => ({ ...previos, especie: "", raza: "" }));
    setErrorGeneral("");
    setCargandoRazas(true);

    const respuesta = await obtenerRazas(id);
    if (especieActual.current !== id) return; // el usuario ya eligió otra especie
    setCargandoRazas(false);

    if (!respuesta.ok) {
      setErrorGeneral(respuesta.error);
      return;
    }
    setRazas(respuesta.datos.razas);
  }

  async function enviar(evento) {
    evento.preventDefault();
    if (cargandoRazas) return;
    const datos = Object.fromEntries(new FormData(evento.currentTarget));
    const tieneRazas = razas.length > 0;

    const nuevosErrores = {
      nombre: validarObligatorio(datos.nombre, "Escribe el nombre de la mascota."),
      especie: validarObligatorio(datos.especie, "Selecciona la especie."),
      sexo: validarObligatorio(datos.sexo, "Selecciona el sexo."),
      raza: tieneRazas ? validarObligatorio(datos.raza, "Selecciona la raza.") : "",
      edad: validarEdad(datos.edad, datos.unidadEdad),
      fechaNacimiento: validarFechaNacimiento(datos.fechaNacimiento),
    };
    setErrores(nuevosErrores);
    setErrorGeneral("");
    if (Object.values(nuevosErrores).some(Boolean)) return;

    setCargando(true);
    const respuesta = await registrarMascota({
      nombre: datos.nombre.trim(),
      especieId: Number(datos.especie),
      razaId: datos.raza ? Number(datos.raza) : null,
      sexo: datos.sexo,
      edad: Number(datos.edad),
      unidadEdad: datos.unidadEdad, // "anios" o "meses"
      fechaNacimiento: datos.fechaNacimiento || null,
    });
    setCargando(false);

    if (!respuesta.ok) {
      setErrorGeneral(respuesta.error);
      return;
    }
    router.push("/mis-mascotas");
  }

  // Texto del campo Raza según el estado
  let textoRaza = "Selecciona..";
  if (!especieId) textoRaza = "Elige la especie";
  else if (cargandoRazas) textoRaza = "Cargando...";
  else if (razas.length === 0) textoRaza = "Sin razas registradas";

  return (
    <>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-popim-primary">
        Paso obligatorio
      </p>
      <h1 className="mt-1.5 text-3xl font-bold text-popim-ink">Registra tu mascota</h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-popim-muted">
        No podrás continuar al portal sin registrar al menos una mascota a tu nombre.
      </p>

      <form onSubmit={enviar} noValidate className="mt-5 flex flex-col gap-3">
        <CampoTexto
          id="nombre"
          etiqueta="Nombre de la mascota"
          placeholder="Ej. Luna"
          error={errores.nombre}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <CampoSelect
            id="especie"
            etiqueta="Especie"
            opciones={especies.map((especie) => ({ valor: especie.id, texto: especie.nombre }))}
            textoVacio={especies.length ? "Selecciona.." : "Cargando..."}
            onChange={alCambiarEspecie}
            error={errores.especie}
          />
          <CampoSelect id="sexo" etiqueta="Sexo" opciones={SEXOS} error={errores.sexo} />
        </div>

        <CampoEdad error={errores.edad} />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <CampoSelect
            key={especieId}
            id="raza"
            etiqueta="Raza"
            opciones={razas.map((raza) => ({ valor: raza.id, texto: raza.nombre }))}
            textoVacio={textoRaza}
            disabled={!especieId || cargandoRazas || razas.length === 0}
            error={errores.raza}
          />
          <CampoTexto
            id="fechaNacimiento"
            etiqueta="Nacimiento (opcional)"
            tipo="date"
            obligatorio={false}
            error={errores.fechaNacimiento}
          />
        </div>

        {errorGeneral && <Mensaje tipo="error">{errorGeneral}</Mensaje>}
        <BotonPrimario cargando={cargando}>Registrar mascota y continuar</BotonPrimario>
      </form>

      <p className="mt-4 text-center text-xs text-popim-muted">
        No es posible acceder al portal sin completar este registro.
      </p>
    </>
  );
}