"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Aviso from "@/Componentes/ui/Aviso";
import Boton from "@/Componentes/ui/Boton";
import EncabezadoVista from "@/Componentes/ui/EncabezadoVista";
import FormularioClinica from "@/Componentes/super/FormularioClinica";
import { IconArrowLeft } from "@/Componentes/Iconos";
import { useCarga } from "@/lib/useCarga";
import { actualizarClinica, asignarAdministrador, obtenerClinica } from "@/servicios/super";

export default function EditarClinicaPage() {
  const { id } = useParams();
  const { datos, error, cargando, recargar } = useCarga(() => obtenerClinica(id), [id]);
  const [mensaje, setMensaje] = useState("");

  const subirAlAviso = () => window.scrollTo({ top: 0, behavior: "smooth" });

  async function guardar(cambios) {
    setMensaje("");
    const respuesta = await actualizarClinica(id, cambios);
    if (respuesta.ok) {
      setMensaje("Los cambios de la clínica quedaron guardados.");
      subirAlAviso();
    }
    return respuesta;
  }

  async function asignarAdmin(datosAdmin) {
    setMensaje("");
    const respuesta = await asignarAdministrador(id, datosAdmin);
    if (respuesta.ok) {
      const admin = respuesta.datos.clinica.administrador;
      setMensaje(
        admin?.estado === "PENDIENTE"
          ? `${admin.nombreCompleto} quedó como administrador. Debe activar su cuenta en «Activar mi cuenta» del login de clínicas.`
          : `${admin?.nombreCompleto ?? "El administrador"} quedó como administrador y ya puede iniciar sesión.`
      );
      recargar(); // vuelve a pedir la clínica: el recuadro rojo cambia por la tarjeta del administrador
      subirAlAviso();
    }
    return respuesta;
  }

  if (cargando) return <p className="text-sm text-popim-texto">Cargando clínica…</p>;
  if (error) return <Aviso tipo="error">{error}</Aviso>;

  const clinica = datos.clinica;

  return (
    <div className="flex flex-col gap-6">
      <EncabezadoVista
        subtitulo="Clínicas › Editar clínica"
        titulo={clinica.nombreComercial}
        descripcion="Cambia los datos, el contacto o el horario. Los cambios de horario no mueven las citas ya agendadas."
      >
        <Boton variante="neutro" href="/super/clinicas"><IconArrowLeft size={16} /> Volver</Boton>
      </EncabezadoVista>

      {mensaje && <Aviso tipo="ok">{mensaje}</Aviso>}

      {/* key: si cambiara de clínica, el formulario se vuelve a crear con sus datos */}
      <FormularioClinica key={clinica.id} modo="editar" inicial={clinica} onGuardar={guardar} onAsignarAdmin={asignarAdmin} />
    </div>
  );
}