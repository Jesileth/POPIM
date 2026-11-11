"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { rutaConsulta } from "@/lib/atencion";
import { iniciarConsulta } from "@/servicios/veterinario";

// const { iniciar, iniciando, error } = useIniciarConsulta();
// iniciar(citaId) abre la consulta y lleva a su pantalla.
// "iniciando" guarda el id de la cita que se está abriendo (para desactivar SOLO ese botón).
export function useIniciarConsulta() {
  const router = useRouter();
  const [iniciando, setIniciando] = useState(null);
  const [error, setError] = useState("");

  async function iniciar(citaId) {
    setError("");
    setIniciando(citaId);
    const respuesta = await iniciarConsulta(citaId);
    if (!respuesta.ok) {
      setIniciando(null);
      setError(respuesta.error);
      return;
    }
    router.push(rutaConsulta(respuesta.datos.consultaId));
  }

  return { iniciar, iniciando, error };
}
