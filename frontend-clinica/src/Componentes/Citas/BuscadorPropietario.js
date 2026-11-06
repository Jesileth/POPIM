

//

"use client";

import { useState } from "react";
import Link from "next/link";
import { IconPerson } from "@/Componentes/Iconos";
import { ESTADOS_USUARIO } from "@/lib/estados";
import { buscarPropietarios } from "@/servicios/propietarios";

// Mismo estilo que CampoTexto, para que todos los campos se vean iguales
const CAMPO =
  "h-12 w-full rounded-xl border border-popim-linea bg-popim-campo px-4 text-sm text-popim-ink outline-none transition placeholder:text-popim-placeholder focus:border-popim-primary focus:ring-4 focus:ring-popim-primary/15";

export default function BuscadorPropietario({ seleccionado, alSeleccionar, error }) {
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState(null); // null = todavía no se ha buscado
  const [buscando, setBuscando] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState("");

  async function buscar(evento) {
    evento.preventDefault(); // que el formulario no recargue la página
    const limpio = texto.trim();
    if (limpio.length < 3) {
      setErrorBusqueda("Escribe al menos 3 caracteres.");
      return;
    }
    setBuscando(true);
    setErrorBusqueda("");
    const respuesta = await buscarPropietarios(limpio);
    setBuscando(false);

    if (!respuesta.ok) {
      setErrorBusqueda(respuesta.error);
      setResultados(null);
      return;
    }
    setResultados(respuesta.datos);
  }

  // ---------- Cara 2: ya hay propietario elegido ----------
  if (seleccionado) {
    const estado = ESTADOS_USUARIO[seleccionado.estadoId];
    return (
      <div className="flex flex-wrap items-center gap-3.5 rounded-xl border-[1.5px] border-popim-primary bg-popim-info p-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-popim-panel-oscuro text-white">
          <IconPerson size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-popim-ink">{seleccionado.nombreCompleto}</p>
          <p className="text-[13px] text-popim-texto">
            {[seleccionado.cedula, seleccionado.telefono].filter(Boolean).join(" · ")}
          </p>
        </div>
        {estado && (
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${estado.clases}`}>
            {estado.nombre}
          </span>
        )}
        <button
          type="button"
          onClick={() => alSeleccionar(null)}
          className="h-10 rounded-lg border border-popim-linea bg-white px-3.5 text-sm font-semibold text-popim-ink transition hover:border-popim-primary"
        >
          Cambiar
        </button>
      </div>
    );
  }

  // ---------- Cara 1: buscador ----------
  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={buscar} className="flex flex-wrap gap-2.5">
        <label htmlFor="buscar-propietario" className="sr-only">
          Buscar propietario
        </label>
        <input
          id="buscar-propietario"
          type="search"
          value={texto}
          onChange={(evento) => setTexto(evento.target.value)}
          placeholder="Cédula, teléfono, correo o nombre"
          aria-invalid={error ? "true" : undefined}
          className={`${CAMPO} min-w-56 flex-1`}
        />
        <button
          type="submit"
          disabled={buscando}
          className="h-12 rounded-xl bg-popim-primary px-5 text-sm font-bold text-white transition hover:bg-popim-primary-dark disabled:opacity-60"
        >
          {buscando ? "Buscando…" : "Buscar"}
        </button>
      </form>

      {(errorBusqueda || error) && (
        <p role="alert" className="text-xs text-red-700">
          {errorBusqueda || error}
        </p>
      )}

      {resultados?.length === 0 && (
        <p className="text-sm text-popim-texto">No encontramos a nadie con «{texto.trim()}».</p>
      )}

      {resultados?.length > 0 && (
        <ul className="flex flex-col gap-2">
          {resultados.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-popim-linea px-3.5 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-popim-ink">{p.nombreCompleto}</p>
                <p className="text-[13px] text-popim-texto">
                  {[p.cedula, p.telefono, p.correo].filter(Boolean).join(" · ")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => alSeleccionar(p)}
                className="h-10 rounded-lg border border-popim-primary px-4 text-sm font-bold text-popim-primary transition hover:bg-popim-info"
              >
                Elegir
              </button>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/propietarios/registrar"
        className="self-start text-sm font-semibold text-popim-primary hover:underline"
      >
        ¿No está? Registrar propietario nuevo
      </Link>
    </div>
  );
}