
"use client";

import { createContext, useContext } from "react";

// Permite que una pantalla le pida al layout cambiar el lema del panel azul
export const PanelContexto = createContext({ fijarLema: () => {} });
export const usePanel = () => useContext(PanelContexto);