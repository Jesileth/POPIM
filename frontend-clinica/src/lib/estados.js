

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
  // Agregado al unir con tu compañero: él usa "No asistió" (AUSENTE)
  506: {
    nombre: "No asistió",
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


// ===========================================================================
// De tu compañero: los mismos estados pero con NOMBRE en vez de número.
// Sus pantallas (Recepción, Confirmación, Detalle, Propietarios...) usan estos.
// Se dejan los dos para que nada se rompa; más adelante conviene usar solo los números.
// ===========================================================================
// Catalogo_estados: 501 SOLICITADA · 502 CONFIRMADA · 503 ATENCION · 504 COMPLETADA · 505 CANCELADA · 506 AUSENTE
export const ESTADOS = {
  SOLICITADA: { nombre: "Solicitada", chip: "bg-amber-50 text-amber-800 ring-amber-200", caja: "border-amber-400 bg-amber-50", texto: "text-amber-700", cuadro: "border-amber-400" },
  CONFIRMADA: { nombre: "Confirmada", chip: "bg-popim-info text-popim-primary ring-popim-aviso-borde", caja: "border-popim-primary/70 bg-popim-info", texto: "text-popim-primary", cuadro: "border-popim-primary" },
  ATENCION: { nombre: "En curso", chip: "bg-teal-50 text-teal-700 ring-teal-200", caja: "border-teal-500 bg-teal-50", texto: "text-teal-700", cuadro: "border-teal-600" },
  COMPLETADA: { nombre: "Finalizada", chip: "bg-emerald-50 text-emerald-700 ring-emerald-200", caja: "border-emerald-500/60 bg-emerald-50", texto: "text-emerald-700", cuadro: "border-emerald-600" },
  CANCELADA: { nombre: "Cancelada", chip: "bg-red-50 text-red-700 ring-red-200", caja: "border-slate-300 bg-slate-50", texto: "text-red-700", cuadro: "border-red-400" },
  AUSENTE: { nombre: "No asistió", chip: "bg-slate-100 text-slate-600 ring-slate-200", caja: "border-slate-300 bg-slate-50", texto: "text-slate-600", cuadro: "border-slate-400" },
};

// Usuarios.estado_id: 102 ACTIVO · 101 PENDIENTE · 105 PROVISIONAL (registrado en clínica, sin credenciales)
export const CUENTAS = {
  ACTIVO: { nombre: "Cuenta activa", chip: "bg-emerald-50 text-emerald-700" },
  PENDIENTE: { nombre: "Pendiente de activar", chip: "bg-popim-info text-popim-primary" },
  PROVISIONAL: { nombre: "Registrado en clínica", chip: "bg-amber-50 text-amber-800" },
  BLOQUEADO: { nombre: "Bloqueada", chip: "bg-red-50 text-red-700" },
  INACTIVO: { nombre: "Inactiva", chip: "bg-slate-100 text-slate-600" },
};

// Traductores entre las dos formas (el backend manda números: estado_id)
export const ID_ESTADO_CITA = { SOLICITADA: 501, CONFIRMADA: 502, ATENCION: 503, COMPLETADA: 504, CANCELADA: 505, AUSENTE: 506 };
export const ID_ESTADO_USUARIO = { PENDIENTE: 101, ACTIVO: 102, PROVISIONAL: 105 };
