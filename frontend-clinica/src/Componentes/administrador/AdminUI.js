import Link from "next/link";

export function TituloAdmin({ ruta = "", titulo, descripcion, accion }) {
  return <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div>{ruta && <p className="mb-2 text-xs text-popim-muted">Administración <span className="mx-1">›</span> {ruta}</p>}
      <h1 className="text-2xl font-extrabold text-popim-ink">{titulo}</h1>
      {descripcion && <p className="mt-1 max-w-3xl text-sm text-popim-texto">{descripcion}</p>}</div>{accion}</div>;
}
export function TarjetaAdmin({ titulo, children, className = "" }) {
  return <section className={`rounded-2xl border border-popim-linea bg-white p-5 ${className}`}>
    {titulo && <h2 className="mb-4 text-base font-bold text-popim-ink">{titulo}</h2>}{children}</section>;
}
export function BotonAdmin({ children, tipo = "button", variante = "primario", href, ...props }) {
  const styles = { primario: "bg-popim-primary text-white hover:bg-popim-primary-dark", secundario: "border border-popim-linea bg-white text-popim-ink hover:bg-popim-page", peligro: "border border-red-300 bg-white text-red-700 hover:bg-red-50" };
  const cn = `inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${styles[variante]}`;
  return href ? <Link href={href} className={cn}>{children}</Link> : <button type={tipo} className={cn} {...props}>{children}</button>;
}
export function CampoAdmin({ etiqueta, className = "", ...props }) {
  return <label className={`block text-sm font-semibold text-popim-ink ${className}`}>{etiqueta && <span className="mb-1.5 block">{etiqueta}</span>}
    <input className="h-10 w-full rounded-lg border border-popim-linea bg-white px-3 text-sm font-normal text-popim-texto outline-none focus:border-popim-primary focus:ring-2 focus:ring-popim-primary/10" {...props} /></label>;
}
export function SelectAdmin({ etiqueta, children, className = "", ...props }) {
  return <label className={`block text-sm font-semibold text-popim-ink ${className}`}>{etiqueta && <span className="mb-1.5 block">{etiqueta}</span>}
    <select className="h-10 w-full rounded-lg border border-popim-linea bg-white px-3 text-sm font-normal text-popim-texto outline-none focus:border-popim-primary" {...props}>{children}</select></label>;
}
export function Estado({ children, tipo = "ok" }) {
  const c = tipo === "error" ? "border-red-300 bg-red-50 text-red-700" : tipo === "pendiente" ? "border-amber-300 bg-amber-50 text-amber-800" : "border-green-300 bg-green-50 text-green-800";
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${c}`}>{children}</span>;
}
export function AvisoAdmin({ children, tipo = "info" }) {
  return <div className={`rounded-xl border px-4 py-3 text-sm ${tipo === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-blue-200 bg-blue-50 text-popim-texto"}`}>{children}</div>;
}
