"use client";

import { useEffect, useState } from "react";
import Campo from "@/Componentes/ui/Campo";
import Selector from "@/Componentes/ui/Selector";
import { obtenerEspecies, obtenerRazas } from "@/servicios/catalogos";
import { ID_ESPECIE_OTRO } from "@/lib/mockClinica";
import { validarEdad, validarFechaNacimiento, validarObligatorio } from "@/lib/validaciones";

export const MASCOTA_VACIA = { nombre: "", especieId: "", razaId: "", sexo: "", edad: "", unidadEdad: "ANIOS", fechaNacimiento: "" };

export function validarMascota(d) {
  const conRazas = d.especieId && String(d.especieId) !== ID_ESPECIE_OTRO;
  return {
    nombre: validarObligatorio(d.nombre, "Escribe el nombre de la mascota."),
    especieId: d.especieId ? "" : "Selecciona la especie.",
    sexo: d.sexo ? "" : "Selecciona el sexo.",
    razaId: conRazas && !d.razaId ? "Selecciona la raza." : "",
    edad: validarEdad(d.edad, d.unidadEdad),
    fechaNacimiento: validarFechaNacimiento(d.fechaNacimiento),
  };
}

const SEXOS = [{ valor: "MACHO", texto: "Macho" }, { valor: "HEMBRA", texto: "Hembra" }];
const UNIDADES = [{ valor: "ANIOS", texto: "Años" }, { valor: "MESES", texto: "Meses" }];

// Campos controlados: el padre guarda `datos` y valida con validarMascota().
export default function CamposMascota({ datos, onCambio, errores = {} }) {
  const [especies, setEspecies] = useState([]);
  const [razas, setRazas] = useState([]);

  useEffect(() => {
    obtenerEspecies().then((r) => r.ok && setEspecies(r.datos.especies));
  }, []);
  useEffect(() => {
    let activo = true;
    if (!datos.especieId) { setRazas([]); return; }
    obtenerRazas(datos.especieId).then((r) => activo && r.ok && setRazas(r.datos.razas));
    return () => { activo = false; };
  }, [datos.especieId]);

  const set = (k) => (e) => onCambio({ ...datos, [k]: e.target.value, ...(k === "especieId" ? { razaId: "" } : {}) });
  const sinRazas = datos.especieId && razas.length === 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Campo id="nombreMascota" etiqueta="Nombre de la mascota" obligatorio placeholder="Ej. Luna" className="sm:col-span-2"
        value={datos.nombre} onChange={set("nombre")} error={errores.nombre} />
      <Selector id="especieId" etiqueta="Especie" obligatorio opciones={especies.map((e) => ({ valor: e.id, texto: e.nombre }))}
        value={datos.especieId} onChange={set("especieId")} error={errores.especieId} />
      <Selector id="sexo" etiqueta="Sexo" obligatorio opciones={SEXOS} value={datos.sexo} onChange={set("sexo")} error={errores.sexo} />
      <Selector id="razaId" etiqueta="Raza" obligatorio={!sinRazas} opciones={razas.map((r) => ({ valor: r.id, texto: r.nombre }))}
        vacio={!datos.especieId ? "Elige la especie" : sinRazas ? "No aplica" : "Selecciona.."}
        disabled={!datos.especieId || sinRazas} value={datos.razaId} onChange={set("razaId")} error={errores.razaId} />
      <Campo id="fechaNacimiento" etiqueta="Nacimiento (opcional)" type="date" value={datos.fechaNacimiento}
        onChange={set("fechaNacimiento")} error={errores.fechaNacimiento} />

      <div className="sm:col-span-2">
        <label htmlFor="edad" className="mb-1.5 block text-[13px] font-semibold text-popim-ink">Edad *</label>
        <div className="flex items-center gap-3">
          <input id="edad" type="number" min={1} inputMode="numeric" placeholder="Ej. 3" value={datos.edad} onChange={set("edad")}
            className={`h-11 min-w-0 flex-1 rounded-xl border bg-white px-3.5 text-sm text-popim-ink outline-none transition focus:border-popim-primary focus:ring-4 focus:ring-popim-primary/15 ${errores.edad ? "border-red-700" : "border-popim-linea"}`} />
          <fieldset className="flex h-11 shrink-0 rounded-xl border border-popim-linea bg-white p-1">
            <legend className="sr-only">Unidad de la edad</legend>
            {UNIDADES.map((u) => (
              <label key={u.valor} className="flex cursor-pointer">
                <input type="radio" name="unidadEdad" value={u.valor} checked={datos.unidadEdad === u.valor} onChange={set("unidadEdad")} className="peer sr-only" />
                <span className="flex items-center rounded-lg px-3 text-sm font-semibold text-popim-muted transition peer-checked:bg-popim-primary peer-checked:text-white">{u.texto}</span>
              </label>
            ))}
          </fieldset>
        </div>
        {errores.edad && <p role="alert" className="mt-1 text-xs text-red-700">{errores.edad}</p>}
      </div>
    </div>
  );
}
