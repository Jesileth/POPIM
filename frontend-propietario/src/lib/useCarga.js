"use client";

import { useEffect, useState } from "react";

// useCarga(obtenerCartilla, mascotaId) → { datos, error }   (datos es null mientras carga)
export function useCarga(servicio, id) {
  const [estado, setEstado] = useState({ datos: null, error: "" });

  useEffect(() => {
    let activo = true;
    servicio(id).then((respuesta) => {
      if (!activo) return;
      setEstado(
        respuesta.ok
          ? { datos: respuesta.datos, error: "" }
          : { datos: null, error: respuesta.error },
      );
    });
    return () => {
      activo = false;
    };
  }, [servicio, id]);

  return estado;
}