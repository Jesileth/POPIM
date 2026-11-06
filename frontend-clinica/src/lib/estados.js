

// Estados de cita (tabla catalogo_estados, entidad CITA).
// Las clases usan los colores --color-estado-… de globals.css
export const ESTADOS_CITA = {
  501: {
    nombre: "Solicitada",
    clases: "bg-estado-solicitada border-estado-solicitada-borde text-estado-solicitada-texto",
  },
  502: {
    nombre: "Confirmada",
    clases: "bg-estado-confirmada border-estado-confirmada-borde text-estado-confirmada-texto",
  },
  503: {
    nombre: "En curso",
    clases: "bg-estado-curso border-estado-curso-borde text-estado-curso-texto",
  },
  504: {
    nombre: "Finalizada",
    clases: "bg-estado-finalizada border-estado-finalizada-borde text-estado-finalizada-texto",
  },
  505: {
    nombre: "Cancelada",
    clases: "bg-estado-cancelada border-estado-cancelada-borde text-estado-cancelada-texto",
  },
};


// Estados de la cuenta del usuario (catalogo_estados, entidad USUARIO).
// Reusa los colores de los estados de cita para no crear más variables.
export const ESTADOS_USUARIO = {
  101: {
    nombre: "Pendiente de activar",
    clases: "bg-estado-confirmada text-estado-confirmada-texto",
  },
  102: {
    nombre: "Cuenta activa",
    clases: "bg-estado-finalizada text-estado-finalizada-texto",
  },
  103: {
    nombre: "Bloqueada",
    clases: "bg-estado-cancelada text-estado-cancelada-texto",
  },
  105: {
    nombre: "Provisional",
    clases: "bg-estado-solicitada text-estado-solicitada-texto",
  },
};  