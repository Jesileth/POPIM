"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import EncabezadoPagina from "@/Componentes/EncabezadoPagina";
import CampoTexto from "@/Componentes/CampoTexto";
import CampoSelect from "@/Componentes/CampoSelect";
import CampoEdad from "@/Componentes/CampoEdad";
import BotonPrimario from "@/Componentes/BotonPrimario";
import Mensaje from "@/Componentes/Mensaje";
import { IconCamera, IconTrash } from "@/Componentes/Iconos";
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

export default function NuevaMascotaPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [especies, setEspecies] = useState([]);
  const [especieId, setEspecieId] = useState("");
  const [razas, setRazas] = useState([]);
  const [cargandoRazas, setCargandoRazas] = useState(false);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [cargando, setCargando] = useState(false);
  const especieActual = useRef("");

  // Estado para la foto de la mascota
  const [fotoArchivo, setFotoArchivo] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);

  // Cargar catálogo de especies
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

  // Manejar selección de foto
  const handleSeleccionarFoto = (e) => {
    const archivo = e.target.files?.[0];
    if (archivo) {
      if (archivo.size > 5 * 1024 * 1024) {
        setErrorGeneral("La imagen no debe superar los 5 MB.");
        return;
      }
      setFotoArchivo(archivo);
      setFotoPreview(URL.createObjectURL(archivo));
      setErrorGeneral("");
    }
  };

  const handleEliminarFoto = () => {
    setFotoArchivo(null);
    setFotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Al seleccionar una especie
  async function alCambiarEspecie(evento) {
    const id = evento.target.value;
    especieActual.current = id;
    setEspecieId(id);
    setRazas([]);
    setErrores((previos) => ({ ...previos, especie: "", raza: "" }));
    setErrorGeneral("");

    if (!id) return;

    setCargandoRazas(true);
    const respuesta = await obtenerRazas(id);
    if (especieActual.current !== id) return;
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
      especieId: datos.especie,
      razaId: datos.raza,
      sexo: datos.sexo,
      edad: Number(datos.edad),
      unidadEdad: datos.unidadEdad || "anios",
      fechaNacimiento: datos.fechaNacimiento || null,
      foto: fotoArchivo,
    });

    setCargando(false);

    if (!respuesta.ok) {
      setErrorGeneral(respuesta.error || "Ocurrió un error al guardar.");
      return;
    }

    // Redirección directa que recarga el estado en /mis-mascotas
    window.location.href = "/mis-mascotas";
  }

  let textoRaza = "Selecciona..";
  if (!especieId) textoRaza = "Elige la especie primero";
  else if (cargandoRazas) textoRaza = "Cargando...";
  else if (razas.length === 0) textoRaza = "Sin razas registradas";

  return (
    <>
      <EncabezadoPagina
        etiqueta="Tu espacio"
        titulo="Registrar mascota"
        descripcion="Todas las mascotas registradas a tu nombre, con su código único. Los datos básicos, una vez guardados, no pueden ser editados."
      />

      {/* AUMENTAMOS EL ANCHO A max-w-4xl */}
      <div className="mt-6 max-w-4xl">
        <div className="rounded-2xl border border-popim-linea bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 border-b border-popim-linea pb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-popim-etiqueta">
              Datos Básicos de la Mascota
            </h2>
          </div>

          <form onSubmit={enviar} noValidate className="flex flex-col gap-6">
            
            {/* SECCIÓN DE FOTO DE LA MASCOTA */}
            <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-popim-linea bg-popim-page/50 p-4 sm:flex-row sm:items-center">
              <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-popim-linea bg-white shadow-inner">
                {fotoPreview ? (
                  <img
                    src={fotoPreview}
                    alt="Previsualización"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-popim-primary">
                    🐾
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col items-center text-center sm:items-start sm:text-left">
                <span className="text-sm font-semibold text-popim-ink">
                  Foto de la mascota (Opcional)
                </span>
                <span className="mt-0.5 text-xs text-popim-muted">
                  Archivos JPG, PNG o WEBP. Máximo 5 MB.
                </span>

                <div className="mt-3 flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleSeleccionarFoto}
                    className="hidden"
                    id="fotoMascotaInput"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-popim-linea bg-white px-3.5 text-xs font-semibold text-popim-ink shadow-sm transition hover:bg-popim-page"
                  >
                    <IconCamera size={14} />
                    {fotoPreview ? "Cambiar foto" : "Subir foto"}
                  </button>

                  {fotoPreview && (
                    <button
                      type="button"
                      onClick={handleEliminarFoto}
                      className="inline-flex h-9 items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                    >
                      <IconTrash size={14} />
                      Quitar
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Nombre */}
            <CampoTexto
              id="nombre"
              etiqueta="Nombre de la mascota"
              placeholder="Ej. Luna"
              error={errores.nombre}
            />

            {/* Especie y Sexo */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <CampoSelect
                id="especie"
                etiqueta="Especie"
                opciones={especies.map((especie) => ({ valor: especie.id, texto: especie.nombre }))}
                textoVacio={especies.length ? "Selecciona.." : "Cargando..."}
                onChange={alCambiarEspecie}
                error={errores.especie}
              />
              <CampoSelect
                id="sexo"
                etiqueta="Sexo"
                opciones={SEXOS}
                textoVacio="Selecciona.."
                error={errores.sexo}
              />
            </div>

            {/* CampoEdad */}
            <CampoEdad error={errores.edad} />

            {/* Raza y Nacimiento */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

            <p className="text-xs text-popim-muted">
              El sistema asignará un Código Único de mascota automáticamente al guardar.
            </p>

            {/* Botones de acción */}
            <div className="flex items-center gap-3 pt-2">
              <BotonPrimario cargando={cargando}>
                Guardar mascota
              </BotonPrimario>

              <button
                type="button"
                onClick={() => router.push("/mis-mascotas")}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-popim-linea bg-white px-6 text-sm font-semibold text-popim-ink transition hover:bg-popim-page"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}