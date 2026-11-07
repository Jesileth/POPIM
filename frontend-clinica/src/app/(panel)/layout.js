"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ProveedorSesion, useSesion } from "@/contexto/SesionContext";
import BarraLateral from "@/Componentes/Layout/BarraLateral";
import Encabezado from "@/Componentes/Layout/Encabezado";
import { agruparAtencion } from "@/lib/atencion";
import { armarMenu, buscarTitulo, tienePermiso } from "@/lib/permisos";
import { obtenerAtencionHoy } from "@/servicios/veterinario";

function Contenido({ children }) {
  const { cargando, sesion, cerrarSesion } = useSesion();
  const router = useRouter();
  const pathname = usePathname();

  // Sin sesión no se entra al panel
  useEffect(() => {
    if (!cargando && !sesion) router.replace("/login");
  }, [cargando, sesion, router]);

  // Veterinario: cuántas emergencias esperan (numerito rojo en "Atención de hoy").
  // Se vuelve a contar cada vez que cambia de pantalla.
  // OJO: este useEffect tiene que ir ANTES del "if (cargando...) return": React exige
  // que los hooks se llamen siempre, en el mismo orden.
  const [insignias, setInsignias] = useState({});
  const veAtencion = tienePermiso(sesion, "ATENCION_VER");
  useEffect(() => {
    if (!veAtencion) return;
    let vigente = true;
    obtenerAtencionHoy().then((respuesta) => {
      if (!vigente || !respuesta.ok) return;
      const { emergencias } = agruparAtencion(respuesta.datos.citas);
      setInsignias({ "/atencion": emergencias.length });
    });
    return () => {
      vigente = false;
    };
  }, [veAtencion, pathname]);

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
      <BarraLateral menu={menu} alCerrarSesion={salir} insignias={insignias} />
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