
//

"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Aviso from "@/Componentes/ui/Aviso";
import Boton from "@/Componentes/ui/Boton";
import EncabezadoVista from "@/Componentes/ui/EncabezadoVista";
import FormularioClinica from "@/Componentes/super/FormularioClinica";
import { IconArrowLeft } from "@/Componentes/Iconos";
import { useCarga } from "@/lib/useCarga";
import { actualizarClinica, obtenerClinica } from "@/servicios/super";

export default function EditarClinicaPage() {
  const { id } = useParams();
  const { datos, error, cargando } = useCarga(() => obtenerClinica(id), [id]);
  const [guardada, setGuardada] = useState(false);

  async function guardar(cambios) {
    setGuardada(false);
    const respuesta = await actualizarClinica(id, cambios);
    if (respuesta.ok) {
      setGuardada(true);
      window.scrollTo({ top: 0, behavior: "smooth" }); // para que vea el aviso verde
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

      {guardada && <Aviso tipo="ok">Los cambios de la clínica quedaron guardados.</Aviso>}

      {/* key: si cambiara de clínica, el formulario se vuelve a crear con sus datos */}
      <FormularioClinica key={clinica.id} modo="editar" inicial={clinica} onGuardar={guardar} />
    </div>
  );
}