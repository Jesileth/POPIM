"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import BarraLateral from "@/Componentes/BarraLateral";
import { IconChevronRight, IconList } from "@/Componentes/Iconos";
import { cerrarSesion, obtenerSesion } from "@/servicios/sesion";

export default function PortalLayout({ children }) {
  const router = useRouter();
  const ruta = usePathname();
  const [sesion, setSesion] = useState(null);
  const [error, setError] = useState("");
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    let activo = true;
    obtenerSesion().then((respuesta) => {
      if (!activo) return;
      if (respuesta.estado === 401) {
        router.replace("/login");
        return;
      }
      if (!respuesta.ok) {
        setError(respuesta.error);
        return;
      }
      setSesion(respuesta.datos);
    });
    return () => {
      activo = false;
    };
  }, [router]);

  async function salir() {
    await cerrarSesion();
    router.replace("/login");
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-sm text-center">
          <p className="text-sm text-popim-texto">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 h-10 rounded-xl bg-popim-primary px-5 text-sm font-semibold text-white hover:bg-popim-primary-dark"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!sesion) {
    return (
      <div role="status" className="flex min-h-screen items-center justify-center text-sm text-popim-muted">
        Cargando tu portal...
      </div>
    );
  }

  const itemActual = sesion.menu.find(
    (item) => ruta === item.ruta || ruta.startsWith(`${item.ruta}/`),
  );

  return (
    <div className="min-h-screen bg-popim-page lg:grid lg:grid-cols-[260px_1fr]">
      <BarraLateral
        menu={sesion.menu}
        usuario={sesion.usuario}
        abierto={menuAbierto}
        onCerrar={() => setMenuAbierto(false)}
        onSalir={salir}
      />

      <div className="min-w-0">
        <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-popim-linea bg-white/90 px-4 backdrop-blur sm:px-8">
          <button
            type="button"
            onClick={() => setMenuAbierto(true)}
            aria-label="Abrir menú"
            className="-ml-2 rounded-lg p-2 text-popim-texto hover:bg-popim-info lg:hidden"
          >
            <IconList size={22} />
          </button>
          <nav aria-label="Ruta de navegación" className="flex items-center gap-2 text-sm">
            <span className="text-popim-etiqueta">Portal del propietario</span>
            <IconChevronRight size={12} className="text-popim-etiqueta" />
            <span className="font-semibold text-popim-ink">{itemActual?.etiqueta ?? "Inicio"}</span>
          </nav>
        </div>

        <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}