

"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { peticion } from "@/lib/api";

const SesionContexto = createContext(null);

// Envuelve el panel: pide la sesión una vez y la comparte con todas las pantallas
export function ProveedorSesion({ children }) {
  const [estado, setEstado] = useState({ cargando: true, sesion: null });

  const recargar = useCallback(async () => {
    const respuesta = await peticion("/auth/sesion");
    setEstado({ cargando: false, sesion: respuesta.ok ? respuesta.datos : null });
  }, []);

  useEffect(() => {
    recargar();
  }, [recargar]);

  const cerrarSesion = useCallback(async () => {
    await peticion("/auth/logout", { metodo: "POST" });
    setEstado({ cargando: false, sesion: null });
  }, []);

  return (
    <SesionContexto.Provider value={{ ...estado, recargar, cerrarSesion }}>
      {children}
    </SesionContexto.Provider>
  );
}

// Para leer la sesión desde cualquier pantalla: const { sesion } = useSesion();
export function useSesion() {
  return useContext(SesionContexto);
}