const TONOS = {
  claro: "rounded-xl bg-popim-info text-popim-primary",
  oscuro: "rounded-full bg-popim-ink text-white",
  
  // Para el veterinario: consulta en curso (verde azulado) y emergencia (rojo)
  curso: "rounded-xl bg-estado-curso text-estado-curso-borde",
  emergencia: "rounded-xl bg-estado-cancelada text-estado-cancelada-borde",
};
const TAMANOS = { sm: "h-9 w-9 text-sm", md: "h-11 w-11 text-base", lg: "h-14 w-14 text-xl", xl: "h-24 w-24 text-4xl", xxl: "h-28 w-28 text-5xl" };

// <Avatar texto="AM" tono="oscuro" />  ·  <Avatar texto={mascota.nombre[0]} />
export default function Avatar({ texto, tono = "claro", tamano = "md", className = "" }) {
  return (
    <span className={`inline-flex shrink-0 items-center justify-center font-bold ${TONOS[tono]} ${TAMANOS[tamano]} ${className}`}>
      {texto}
    </span>
  );
}
