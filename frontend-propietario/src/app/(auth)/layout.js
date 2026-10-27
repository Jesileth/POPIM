///


"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import HeaderPopim from "@/Componentes/HeaderPopim";
import PanelPopim from "@/Componentes/PanelPopim";
import { PanelContexto } from "@/lib/panelContexto";

// En qué lado va el panel azul y qué lema muestra en cada pantalla.
// Para cambiar un lado, cambia "izquierda" por "derecha" (o al revés).
const CONFIG_PANEL = {
  "/login": { lado: "izquierda", lema: ["Tu mascota,", "en buenas manos."] },
  "/registro": { lado: "derecha", lema: ["Tu mascota,", "en buenas manos."] },
  "/registro-mascota": { lado: "derecha", lema: ["Un último", "paso."] },
  "/activar-cuenta": { lado: "derecha", lema: ["Ya tienes un perfil", "con nosotros."] },
  "/recuperar-password": { lado: "izquierda", lema: "¿Olvidaste tu contraseña?" },
};

//#region codigo anterior
/*export default function AuthLayout({ children }) {
  const ruta = usePathname();
  const { lado, lema } = CONFIG_PANEL[ruta] ?? CONFIG_PANEL["/login"];
  const panelDerecha = lado === "derecha";

  return (
    <main className="px-4 py-6 sm:px-8 sm:py-10">
      <HeaderPopim />

      <div className="relative mx-auto mt-10 min-h-125 max-w-245 overflow-hidden rounded-[40px] bg-white shadow-sm">
        {/* Panel azul: se desliza de un lado al otro (solo en pantallas grandes) }
        <div
          aria-hidden="true"
          className={`absolute inset-y-0 left-0 z-10 hidden w-1/2 transition-transform duration-700 ease-in-out motion-reduce:transition-none lg:block ${
            panelDerecha ? "translate-x-full" : "translate-x-0"
          }`}
        >
          <PanelPopim lema={lema} />
        </div>

        {/* Formulario: ocupa la mitad que el panel deja libre }
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
}*/
//#endregion

// Altura mínima de la tarjeta: se ajusta al alto de la ventana (entre 520 y 640 px)
const ALTURA_TARJETA = "lg:min-h-[clamp(520px,calc(100dvh_-_140px),640px)]";

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
      {/*José Torres - agregar w-full si se desea que el header ocupe todo el ancho de la pantalla*/}
      <main className="flex min-h-dvh flex-col px-4 py-4 sm:px-8 sm:py-6 lg:justify-center">
        <HeaderPopim />
        
        {/* <div className="relative mx-auto mt-10 lg:min-h-150 max-w-245 overflow-hidden rounded-[40px] bg-white shadow-sm">*/}
        <div className="relative mx-auto mt-14 w-full lg:min-h-150 max-w-245 overflow-hidden rounded-[40px] bg-white shadow-sm border border-[#f4f3f3] lg:mt-5 lg:flex lg:min-h-152 lg:rounded-[40px]">
          {/* Panel azul: se desliza de un lado al otro (solo en pantallas grandes) */}
          <div
            aria-hidden="true"
            className={`absolute inset-y-0 left-0 z-10 hidden w-1/2 transition-transform duration-700 ease-in-out motion-reduce:transition-none lg:block ${
              panelDerecha ? "translate-x-full" : "translate-x-0"
            }`}
          >
            <PanelPopim lema={lemaExtra ?? lema} />
          </div>

           {/* Formulario: ocupa la mitad que el panel deja libre */}
          <div
            className={`flex lg:w-1/2 ${ALTURA_TARJETA} ${
              panelDerecha ? "lg:ml-0" : "lg:ml-[50%]"
            }`}
          >
            <div
              key={ruta}
              className="flex w-full animate-aparecer flex-col justify-center px-8 py-7 motion-reduce:animate-none sm:px-12 lg:py-5"
            >
              {children}
            </div>
          </div>
        </div>
      </main>
    </PanelContexto.Provider>
  );
}


//#region CodPara hacerlo más pequeño
/*
        <div className="mx-auto mt-10 max-w-245 overflow-hidden rounded-[32px] border border-[#d7e1ea] bg-white shadow-sm">
          <div className="grid lg:grid-cols-2">
            <div className={panelDerecha ? "order-2" : "order-1"}>
              <div className="flex min-h-[520px] items-center justify-center px-8 py-7 sm:px-12">
                {children}
              </div>
            </div>

            <div className={panelDerecha ? "order-1" : "order-2"}>
              <div className="h-full bg-[#cfe5f1]">
                <PanelPopim lema={lemaExtra ?? lema} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </PanelContexto.Provider>
  );
*/
//#endregion
