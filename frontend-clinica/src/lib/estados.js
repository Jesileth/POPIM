

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