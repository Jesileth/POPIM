"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import PawIcon from "@/Componentes/PawIcon";
import {
  IconBoxArrowRight,
  IconCalendarCheck,
  IconCalendarPlus,
  IconList,
} from "@/Componentes/Iconos";
import { iniciales } from "@/lib/formato";

// La columna Menus.icono de la base de datos trae uno de estos nombres
function iconoDeMenu(nombre) {
  switch (nombre) {
    case "paw":
      return <PawIcon className="h-4.5 w-4.5" />;
    case "calendar-plus":
      return <IconCalendarPlus size={18} />;
    case "calendar-check":
      return <IconCalendarCheck size={18} />;
    default:
      return <IconList size={18} />;
  }
}

export default function BarraLateral({ menu, usuario, abierto, onCerrar, onSalir }) {
  const ruta = usePathname();

  const contenido = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-5">
        <Image src="/Imagenes/LogoPopim.png" alt="" width={40} height={40} />
        <div className="leading-tight">
          <p className="text-lg font-bold text-popim-ink">POPIM</p>
          <p className="text-[11px] text-popim-etiqueta">Salud animal</p>
        </div>
      </div>

      <p className="px-5 pb-2 pt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-popim-etiqueta">
        Menú
      </p>
      <nav aria-label="Principal" className="flex-1 space-y-1 px-3">
        {menu.map((item) => {
          const activo = ruta === item.ruta || ruta.startsWith(`${item.ruta}/`);
          return (
            <Link
              key={item.id}
              href={item.ruta}
              onClick={onCerrar}
              aria-current={activo ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                activo
                  ? "bg-popim-info text-popim-primary"
                  : "text-popim-texto hover:bg-popim-page hover:text-popim-ink"
              }`}
            >
              {iconoDeMenu(item.icono)}
              {item.etiqueta}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-popim-linea p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-popim-info text-sm font-bold text-popim-primary">
            {iniciales(usuario.nombreCompleto)}
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold text-popim-ink">{usuario.nombreCompleto}</p>
            <p className="text-xs text-popim-etiqueta">
              {usuario.rol === "PROPIETARIO" ? "Propietario" : usuario.rol}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onSalir}
          className="mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-popim-muted transition hover:bg-red-50 hover:text-red-700"
        >
          <IconBoxArrowRight size={18} />
          Cerrar sesión
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden self-start border-r border-popim-linea bg-white lg:sticky lg:top-0 lg:block lg:h-screen">
        {contenido}
      </aside>

      {abierto && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={onCerrar}
            className="absolute inset-0 bg-popim-ink/40"
          />
          <aside className="relative h-full w-72 bg-white shadow-xl">{contenido}</aside>
        </div>
      )}
    </>
  );
}