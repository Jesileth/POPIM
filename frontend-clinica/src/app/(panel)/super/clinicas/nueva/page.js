//

"use client";

import { useRouter } from "next/navigation";
import EncabezadoVista from "@/Componentes/ui/EncabezadoVista";
import FormularioClinica from "@/Componentes/super/FormularioClinica";
import { registrarClinica } from "@/servicios/super";

export default function RegistrarClinicaPage() {
  const router = useRouter();

  // FormularioClinica valida y arma los datos; aquí solo se envían y, si sale bien,
  // se vuelve a la lista con el nombre en la URL para mostrar el aviso verde
  async function guardar(datos) {
    const respuesta = await registrarClinica(datos);
    if (respuesta.ok) {
      const nombre = respuesta.datos.clinica.nombreComercial;
      router.push(`/super/clinicas?registrada=${encodeURIComponent(nombre)}`);
    }
    return respuesta;
  }

  return (
    <div className="flex flex-col gap-6">
      <EncabezadoVista
        subtitulo="Clínicas › Registrar clínica"
        titulo="Registrar clínica"
        descripcion="Agrega una clínica veterinaria a la red. Los campos con * son obligatorios."
      />
      <FormularioClinica modo="registrar" onGuardar={guardar} />
    </div>
  );
}