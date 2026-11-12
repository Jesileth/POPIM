
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import PawIcon from "@/Componentes/Paneles/PawIcon";
import {
  IconBarChart,
  IconBoxArrowRight,
  IconBuilding,
  IconCalendarCheck,
  IconCalendarEvent,
  IconChevronRight,
  IconClipboardPulse,
  IconClock,
  IconFileMedical,
  IconGrid,
  IconHeartPulse,
  IconList,
  IconPerson,
  IconPersonBadge,
  IconShieldCheck,
} from "@/Componentes/Iconos";
import { rutaActiva } from "@/lib/permisos";

// Texto de la columna "icono" de la tabla menus → componente de Iconos.js
const ICONOS = {
  agenda: IconCalendarEvent,
  tablero: IconClock,
  personas: IconPerson,
  huella: PawIcon,
  citas: IconCalendarCheck,
  atencion: IconHeartPulse,
  consultas: IconClipboardPulse,
  pacientes: IconFileMedical,
  personal: IconPersonBadge,
    personal: IconPersonBadge,
  // Super Administrador
  panel: IconGrid,
  clinicas: IconBuilding,
  reportes: IconBarChart,
  escudo: IconShieldCheck,  
};

// Muestra el ícono del menú; si el nombre no existe, usa el de lista
function IconoMenu({ nombre }) {
  if (nombre === "huella") return <PawIcon className="h-5 w-5 shrink-0" />;
  const Componente = ICONOS[nombre] ?? IconList;
  return <Componente size={18} className="shrink-0" />;
}

// Estilos que se repiten
const BASE = "flex min-h-11 w-full items-center gap-3 rounded-xl px-3.5 text-[15px] transition";
const NORMAL = "font-medium text-white/80 hover:bg-white/8 hover:text-white";
const ACTIVA = "bg-popim-primary font-semibold text-white";

// insignias = { "/atencion": 1 } → numerito rojo al lado de esa opción (0 o nada = no se muestra)
export default function BarraLateral({ menu, alCerrarSesion, insignias = {} }) {
  const pathname = usePathname();
  const [manual, setManual] = useState({}); // grupos que el usuario abrió o cerró a mano
  const [abiertoMovil, setAbiertoMovil] = useState(false);

  // Todas las rutas del menú (y Mi perfil) para saber cuál está activa
  const rutas = [
    ...menu.flatMap((item) => [item.ruta, ...item.hijos.map((h) => h.ruta)]),
    "/perfil",
  ].filter(Boolean);
  const activa = rutaActiva(rutas, pathname);
  const cerrarMovil = () => setAbiertoMovil(false);

  return (
    <aside className="bg-popim-panel-oscuro text-white print:hidden lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-64 lg:shrink-0 lg:flex-col">      {/* Logo + botón de menú (este último solo en celular) */}
      <div className="flex items-center justify-between gap-3 px-5 py-5 lg:py-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10.5 w-10.5 items-center justify-center rounded-xl bg-popim-primary">
            <PawIcon className="h-6 w-6 text-white" />
          </span>
          <div>
            <p className="text-xl font-extrabold tracking-wide">POPIM</p>
            <p className="text-xs text-popim-panel-suave">Portal de clínica</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setAbiertoMovil((actual) => !actual)}
          aria-expanded={abiertoMovil}
          aria-controls="menu-panel"
          className="flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-white/90 hover:bg-white/8 lg:hidden"
        >
          <IconList size={20} />
          Menú
        </button>
      </div>

      <div
        id="menu-panel"
        className={`${abiertoMovil ? "flex" : "hidden"} flex-1 flex-col gap-6 overflow-y-auto px-4 pb-6 lg:flex`}
      >
        <nav aria-label="Menú principal" className="flex flex-col gap-1">
          {menu.map((item) => {
            // Opción sin submenús: un enlace normal
            if (item.hijos.length === 0) {
              const esActiva = item.ruta === activa;
              return (
                <Link
                  key={item.id}
                  href={item.ruta ?? "#"}
                  onClick={cerrarMovil}
                  aria-current={esActiva ? "page" : undefined}
                  className={`${BASE} ${esActiva ? ACTIVA : NORMAL}`}
                >
                  <IconoMenu nombre={item.icono} />
                  <span className="flex-1">{item.etiqueta}</span>
                  {insignias[item.ruta] > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-estado-emergencia px-1.5 text-[11px] font-bold text-white">
                      {insignias[item.ruta]}
                    </span>
                  )}
                </Link>
              );
            }

            // Opción con submenús: se abre y se cierra
            const contieneActiva = item.hijos.some((h) => h.ruta === activa);
            const abierto = manual[item.id] ?? contieneActiva;

            return (
              <div key={item.id}>
                <button
                  type="button"
                  onClick={() => setManual((actual) => ({ ...actual, [item.id]: !abierto }))}
                  aria-expanded={abierto}
                  className={`${BASE} ${contieneActiva ? "bg-white/8 font-bold text-white" : NORMAL}`}
                >
                  <IconoMenu nombre={item.icono} />
                  <span className="flex-1 text-left">{item.etiqueta}</span>
                  <IconChevronRight
                    size={14}
                    className={`shrink-0 transition-transform ${abierto ? "rotate-90" : ""}`}
                  />
                </button>

                {abierto && (
                  <ul className="mb-1.5 ml-6 mt-0.5 flex flex-col gap-0.5 border-l border-white/20 pl-3">
                    {item.hijos.map((hijo) => {
                      const esActiva = hijo.ruta === activa;
                      return (
                        <li key={hijo.id}>
                          <Link
                            href={hijo.ruta}
                            onClick={cerrarMovil}
                            aria-current={esActiva ? "page" : undefined}
                            className={`block rounded-lg px-3 py-2.5 text-sm transition ${
                              esActiva
                                ? "bg-popim-primary font-semibold text-white"
                                : "text-white/75 hover:bg-white/8 hover:text-white"
                            }`}
                          >
                            {hijo.etiqueta}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>

        {/* Abajo: Mi perfil y Cerrar sesión (todos los roles los tienen) */}
        <div className="mt-auto flex flex-col gap-1 border-t border-white/12 pt-4">
          <Link
            href="/perfil"
            onClick={cerrarMovil}
            aria-current={activa === "/perfil" ? "page" : undefined}
            className={`${BASE} ${activa === "/perfil" ? ACTIVA : NORMAL}`}
          >
            <IconPerson size={18} className="shrink-0" />
            Mi perfil
          </Link>
          <button type="button" onClick={alCerrarSesion} className={`${BASE} ${NORMAL}`}>
            <IconBoxArrowRight size={18} className="shrink-0" />
            Cerrar sesión
          </button>
        </div>
      </div>
    </aside>
  );
}