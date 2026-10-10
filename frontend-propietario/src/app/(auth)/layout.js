///


"use client";

import { usePathname } from "next/navigation";
import HeaderPopim from "@/Componentes/HeaderPopim";
import PanelPopim from "@/Componentes/PanelPopim";

// En qué lado va el panel azul y qué lema muestra en cada pantalla.
// Para cambiar un lado, cambia "izquierda" por "derecha" (o al revés).
const CONFIG_PANEL = {
  "/login": { lado: "izquierda", lema: "Tu mascota, en buenas manos." },
  "/registro": { lado: "derecha", lema: "Tu mascota, en buenas manos." },
  "/registro-mascota": { lado: "izquierda", lema: "Un último paso." },
  "/activar-cuenta": { lado: "izquierda", lema: "Ya tienes un perfil con nosotros." },
  "/recuperar-password": { lado: "izquierda", lema: "¿Olvidaste tu contraseña?" },
};

export default function AuthLayout({ children }) {
  const ruta = usePathname();
  const { lado, lema } = CONFIG_PANEL[ruta] ?? CONFIG_PANEL["/login"];
  const panelDerecha = lado === "derecha";

  return (
    <main className="px-4 py-6 sm:px-8 sm:py-10">
      <HeaderPopim />

      <div className="relative mx-auto mt-10 min-h-125 max-w-245 overflow-hidden rounded-[40px] bg-white shadow-sm">
        {/* Panel azul: se desliza de un lado al otro (solo en pantallas grandes) */}
        <div
          aria-hidden="true"
          className={`absolute inset-y-0 left-0 z-10 hidden w-1/2 transition-transform duration-700 ease-in-out motion-reduce:transition-none lg:block ${
            panelDerecha ? "translate-x-full" : "translate-x-0"
          }`}
        >
          <PanelPopim lema={lema} />
        </div>

        {/* Formulario: ocupa la mitad que el panel deja libre */}
        <div
          className={`flex min-h-125 lg:w-1/2 ${
            panelDerecha ? "lg:ml-0" : "lg:ml-[50%]"
          }`}
        >
          <div
            key={ruta}
            className="flex w-full animate-aparecer flex-col justify-center px-8 py-10 motion-reduce:animate-none sm:px-12"
          >
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}