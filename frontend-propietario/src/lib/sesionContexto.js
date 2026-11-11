"use client";

import { createContext, useContext } from "react";

// { usuario, menu, permisos, actualizarUsuario(cambios) }
export const SesionContexto = createContext(null);
export const useSesion = () => useContext(SesionContexto);