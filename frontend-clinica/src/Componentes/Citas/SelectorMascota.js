

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PawIcon from "@/Componentes/Paneles/PawIcon";
import { obtenerMascotasDePropietario } from "@/servicios/propietarios";

// Muestra las mascotas de un propietario para elegir una.
// Quien lo usa le pone key={propietarioId}: así, al cambiar de propietario,
// el componente empieza de cero (vuelve a decir "Cargando…").
export default function SelectorMascota({ propietarioId, seleccionada, alSeleccionar, error }) {
  const [datos, setDatos] = useState({ cargando: true, error: "", mascotas: [] });

  useEffect(() => {
    let vigente = true;
    obtenerMascotasDePropietario(propietarioId).then((respuesta) => {
      if (!vigente) return;
      setDatos(
        respuesta.ok
          ? { cargando: false, error: "", mascotas: respuesta.datos }
          : { cargando: false, error: respuesta.error, mascotas: [] },
      );
    });
    return () => {
      vigente = false;
    };
  }, [propietarioId]);

  if (datos.cargando) return <p className="text-sm text-popim-texto">Cargando mascotas…</p>;
  if (datos.error) return <Mensaje error={datos.error} />;

  return (
    <div className="flex flex-col gap-2">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {datos.mascotas.map((m) => {
          const elegida = seleccionada?.id === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => alSeleccionar(m)}
              aria-pressed={elegida}
              className={`flex items-center gap-3 rounded-xl p-3 text-left transition ${
                elegida
                  ? "border-[1.5px] border-popim-primary bg-popim-info"
                  : "border border-popim-linea bg-white hover:border-popim-primary"
              }`}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-popim-info text-popim-primary">
                <PawIcon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block font-bold text-popim-ink">{m.nombre}</span>
                <span className="block text-xs text-popim-texto">
                  {[m.especie, m.raza, m.edad].filter(Boolean).join(" · ")}
                </span>
              </span>
            </button>
          );
        })}

        <Link
          href={`/mascotas/registrar?propietario=${propietarioId}`}
          className="flex min-h-17 items-center justify-center rounded-xl border-[1.5px] border-dashed border-popim-linea text-sm font-semibold text-popim-primary transition hover:border-popim-primary"
        >
          + Nueva mascota
        </Link>
      </div>

      {datos.mascotas.length === 0 && (
        <p className="text-sm text-popim-texto">Este propietario todavía no tiene mascotas registradas.</p>
      )}
      {error && (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

// Mensaje de error pequeño dentro del selector
function Mensaje({ error }) {
  return (
    <p role="alert" className="text-sm text-red-700">
      {error}
    </p>
  );
}