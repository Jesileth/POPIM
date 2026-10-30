"use client";

import { useRef, useState } from "react";
import Avatar from "@/Componentes/Avatar";
import { IconCamera, IconX, IconTrash } from "@/Componentes/Iconos";
import { MAX_IMAGEN_MB, TIPOS_IMAGEN, validarImagen } from "@/lib/validaciones";

export default function SelectorFoto({
  nombre,
  fotoUrl,
  tamano = 96,
  mostrarAcciones = true,
  onSubir,
  onQuitar,
}) {
  const entrada = useRef(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function alElegir(evento) {
    const archivo = evento.target.files?.[0];
    evento.target.value = ""; // permite elegir el mismo archivo otra vez
    if (!archivo) return;

    const mensaje = validarImagen(archivo);
    if (mensaje) {
      setError(mensaje);
      return;
    }
    setError("");
    setCargando(true);
    const respuesta = await onSubir(archivo);
    setCargando(false);
    if (!respuesta.ok) setError(respuesta.error);
  }

  async function quitar() {
    setError("");
    setCargando(true);
    const respuesta = await onQuitar();
    setCargando(false);
    if (!respuesta.ok) setError(respuesta.error);
  }

  return (
    <div>
      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          <Avatar nombre={nombre} fotoUrl={fotoUrl} tamano={tamano} />
          {cargando && (
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-white/70 text-[11px] font-semibold text-popim-primary">
              ...
            </span>
          )}
          <button
            type="button"
            onClick={() => entrada.current?.click()}
            disabled={cargando}
            aria-label={fotoUrl ? "Cambiar foto" : "Subir foto"}
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-popim-primary text-white shadow transition hover:bg-popim-primary-dark disabled:opacity-60"
          >
            <IconCamera size={14} />

          </button>
          {!mostrarAcciones && fotoUrl && onQuitar && (
            <button
              type="button"
              onClick={quitar}
              disabled={cargando}
              aria-label="Quitar foto"
              className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-slate-600 text-white shadow transition hover:bg-red-600 disabled:opacity-60"
            >
              <IconX size={10} />
            </button>
          )}
        </div>

        {mostrarAcciones && (
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => entrada.current?.click()}
                disabled={cargando}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-popim-primary/40 bg-white px-3.5 text-xs font-semibold text-popim-primary transition shadow-sm hover:bg-popim-page"

              >
                <IconCamera size={14} />
                {fotoUrl ? "Cambiar foto" : "Subir foto"}
              </button>
              {fotoUrl && onQuitar && (
                <button
                  type="button"
                  onClick={quitar}
                  disabled={cargando}
                      className="inline-flex h-9 items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                >
                  <IconTrash size={14} />
                  Quitar
                </button>
              )}
            </div>
            <p className="mt-2 text-xs text-popim-muted">JPG, PNG o WebP · máx. {MAX_IMAGEN_MB} MB</p>
          </div>
        )}

        <input
          ref={entrada}
          type="file"
          accept={TIPOS_IMAGEN.join(",")}
          onChange={alElegir}
          tabIndex={-1}
          className="sr-only"
        />
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}