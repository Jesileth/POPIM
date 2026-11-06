
"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ProveedorSesion, useSesion } from "@/contexto/SesionContext";
import BarraLateral from "@/Componentes/Layout/BarraLateral";
import Encabezado from "@/Componentes/Layout/Encabezado";
import { armarMenu, buscarTitulo } from "@/lib/permisos";

function Contenido({ children }) {
  const { cargando, sesion, cerrarSesion } = useSesion();
  const router = useRouter();
  const pathname = usePathname();

  // Sin sesión no se entra al panel
  useEffect(() => {
    if (!cargando && !sesion) router.replace("/login");
  }, [cargando, sesion, router]);

  if (cargando || !sesion) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-popim-page text-sm text-popim-texto">
        Cargando…
      </div>
    );
  }

  async function salir() {
    await cerrarSesion();
    router.replace("/login");
  }

  const menu = armarMenu(sesion.menu);
  const titulo = buscarTitulo(sesion.menu, pathname);

  return (
    <div className="flex min-h-dvh flex-col bg-popim-page lg:flex-row">
      <BarraLateral menu={menu} alCerrarSesion={salir} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Encabezado usuario={sesion.usuario} titulo={titulo} />
        <main className="flex-1 px-5 py-6 lg:px-8 lg:py-7">{children}</main>
      </div>
    </div>
  );
}

export default function PanelLayout({ children }) {
  return (
    <ProveedorSesion>
      <Contenido>{children}</Contenido>
    </ProveedorSesion>
  );
}