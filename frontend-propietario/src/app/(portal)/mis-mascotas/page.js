"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import EncabezadoPagina from "@/Componentes/EncabezadoPagina";
import EstadoVacio from "@/Componentes/EstadoVacio";
import Mensaje from "@/Componentes/Mensaje";
import TarjetaMascota from "@/Componentes/TarjetaMascota";
import { IconPlus } from "@/Componentes/Iconos";
import PawIcon from "@/Componentes/PawIcon";
import { listarMascotas } from "@/servicios/mascotas";

export default function MisMascotasPage() {
  const [mascotas, setMascotas] = useState(null); // null = cargando
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    listarMascotas().then((respuesta) => {
      if (!activo) return;
      if (respuesta.ok) setMascotas(respuesta.datos.mascotas);
      else setError(respuesta.error);
    });
    return () => {
      activo = false;
    };
  }, []);

  return (
    <>
      <EncabezadoPagina
        etiqueta="Tu espacio"
        titulo="Mis mascotas"
        descripcion="Todas las mascotas registradas a tu nombre, con su código único. Los datos básicos, una vez guardados, no pueden ser editados."
      >
        <Link
          href="/mis-mascotas/nueva"
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-popim-primary px-5 text-sm font-semibold text-white shadow-lg shadow-popim-primary/25 transition hover:bg-popim-primary-dark"
        >
          <IconPlus size={16} />
          Registrar mascota
        </Link>
      </EncabezadoPagina>

      <div className="mt-6">
        {error && <Mensaje tipo="error">{error}</Mensaje>}

        {mascotas === null && !error && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" role="status" aria-label="Cargando mascotas">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-56 animate-pulse rounded-2xl border border-popim-linea bg-white" />
            ))}
          </div>
        )}

        {mascotas?.length === 0 && (
          <EstadoVacio
            icono={(props) => <PawIcon className="h-5.5 w-5.5" {...props} />}
            titulo="Aún no tienes mascotas registradas"
            texto="Registra a tu primera mascota para poder solicitar citas y ver su historial."
            accion={{ href: "/mis-mascotas/nueva", texto: "Registrar mascota" }}
          />
        )}

        {mascotas?.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {mascotas.map((mascota) => (
              <TarjetaMascota key={mascota.id} mascota={mascota} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}