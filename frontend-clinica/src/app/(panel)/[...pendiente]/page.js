
//

"use client";

import { usePathname } from "next/navigation";
import { useSesion } from "@/contexto/SesionContext";
import { buscarTitulo } from "@/lib/permisos";
import EnConstruccion from "@/Componentes/EnConstruccion";

// Cuándo esperamos cada módulo. Cámbialo a tu gusto; lo que no esté aquí dice "Próximamente".
const PENDIENTES = {
  "/agenda": "Siguiente entrega",
};

export default function ModuloPendiente() {
  const pathname = usePathname();
  const { sesion } = useSesion();
  const modulo = buscarTitulo(sesion?.menu, pathname) || "Este módulo";

  return <EnConstruccion modulo={modulo} pendiente={PENDIENTES[pathname] ?? "Próximamente"} />;
}