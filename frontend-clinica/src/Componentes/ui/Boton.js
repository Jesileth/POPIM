import Link from "next/link";

const VARIANTES = {
  primario: "border border-transparent bg-popim-primary text-white hover:bg-popim-primary-dark",
  secundario: "border border-popim-primary/50 bg-white text-popim-primary hover:bg-popim-info",
  neutro: "border border-popim-linea bg-white text-popim-ink hover:bg-popim-page",
  peligro: "border border-popim-linea bg-white text-red-700 hover:border-red-200 hover:bg-red-50",
  emergencia: "border border-red-600 bg-white text-red-700 hover:bg-red-50",
  // Botones rellenos del veterinario: "Continuar" (consulta en curso) y "Atender ahora" (emergencia)
  curso: "border border-transparent bg-estado-curso-borde text-white hover:brightness-90",
  urgente: "border border-transparent bg-estado-emergencia text-white hover:brightness-90",
  enlace: "text-popim-primary hover:underline",
};
const TAMANOS = { md: "h-11 px-5 text-sm", sm: "h-9 px-3.5 text-[13px]" };

export default function Boton({ children, variante = "primario", tamano = "md", href, className = "", type = "button", ...resto }) {
  const clase = `inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
    variante === "enlace" ? "text-sm" : TAMANOS[tamano]
  } ${VARIANTES[variante]} ${className}`;
  if (href) return <Link href={href} className={clase} {...resto}>{children}</Link>;
  return <button type={type} className={clase} {...resto}>{children}</button>;
}
