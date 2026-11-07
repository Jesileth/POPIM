"use client";

import { useEffect, useState } from "react";

// useCarga(() => obtenerAgenda(fecha), [fecha]) -> { datos, error, cargando, recargar }
export function useCarga(cargar, deps = []) {
  const [estado, setEstado] = useState({ datos: null, error: "", cargando: true });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let activo = true;
    cargar().then((r) => {
      if (!activo) return;
      setEstado(r.ok ? { datos: r.datos, error: "", cargando: false } : { datos: null, error: r.error, cargando: false });
    });
    return () => {
      activo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version]);

  return { ...estado, recargar: () => setVersion((v) => v + 1) };
}
