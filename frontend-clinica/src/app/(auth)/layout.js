"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import PanelPopim from "@/Componentes/Paneles/PanelPopim";
import PawIcon from "@/Componentes/Paneles/PawIcon";
import { PanelContexto } from "@/lib/panelContexto";

// Qué lema muestra el panel en cada pantalla y de qué lado va.
// Para cambiar un lado, cambia "izquierda" por "derecha" (o al revés).
const CONFIG_PANEL = {
  "/login": { lado: "izquierda", lema: ["Tu clínica,", "al día."] },
  "/activar-cuenta": { lado: "izquierda", lema: ["Bienvenido", "al equipo."] },
  "/recuperar-password": { lado: "izquierda", lema: ["Recupera", "tu acceso."] },
};

export default function AuthLayout({ children }) {
  const ruta = usePathname();
  const [lemaExtra, setLemaExtra] = useState(null);
  const [rutaVista, setRutaVista] = useState(ruta);

  // Al cambiar de pantalla se descarta el lema especial
  if (ruta !== rutaVista) {
    setRutaVista(ruta);
    setLemaExtra(null);
  }

  const { lado, lema } = CONFIG_PANEL[ruta] ?? CONFIG_PANEL["/login"];
  const panelDerecha = lado === "derecha";

  return (
    <PanelContexto.Provider value={{ fijarLema: setLemaExtra }}>
      <div
        className={`flex min-h-dvh bg-white ${
          panelDerecha ? "lg:flex-row-reverse" : "lg:flex-row"
        }`}
      >
        {/* Panel institucional: solo en pantallas grandes */}
        <div className="hidden lg:flex lg:w-[52%]">
          <PanelPopim lema={lemaExtra ?? lema} />
        </div>

        {/* Formulario */}
        <main className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10">
          <div
            key={ruta}
            className="w-full max-w-100 animate-aparecer motion-reduce:animate-none"
          >
            {/* Logo pequeño: solo en celular, porque ahí el panel se oculta */}
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-popim-primary">
                <PawIcon className="h-6 w-6 text-white" />
              </span>
              <div>
                <p className="text-lg font-extrabold text-popim-ink">POPIM</p>
                <p className="text-xs text-popim-texto">Portal de clínicas</p>
              </div>
            </div>

            {children}
          </div>
        </main>
      </div>
    </PanelContexto.Provider>
  );
}