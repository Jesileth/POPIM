import { peticion } from "@/lib/api";

export const listarCitas = () => peticion("/citas");

export const solicitarCita = (cuerpo) => peticion("/citas", { metodo: "POST", cuerpo });

export const cancelarCita = (citaId, motivoCancelacion) =>
  peticion(`/citas/${citaId}/cancelar`, { metodo: "POST", cuerpo: { motivoCancelacion } });