import { IconChevronDown } from "@/Componentes/Iconos";

// opciones = [{ valor, texto }]. `vacio` es el texto de la opción sin valor.
export default function Selector({ id, etiqueta, opciones, vacio = "Selecciona..", error = "", obligatorio = false, className = "", ...resto }) {
  return (
    <div className={className}>
      {etiqueta && (
        <label htmlFor={id} className="mb-1.5 block text-[13px] font-semibold text-popim-ink">
          {etiqueta}
          {obligatorio && " *"}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          name={id}
          aria-label={etiqueta ? undefined : vacio}
          aria-invalid={error ? "true" : undefined}
          className={`h-11 w-full appearance-none rounded-xl border bg-white pl-3.5 pr-9 text-sm text-popim-ink outline-none transition focus:border-popim-primary focus:ring-4 focus:ring-popim-primary/15 disabled:cursor-not-allowed disabled:bg-slate-100 ${
            error ? "border-red-700" : "border-popim-linea"
          }`}
          {...resto}
        >
          <option value="">{vacio}</option>
          {opciones.map((o) => (
            <option key={o.valor} value={o.valor}>{o.texto}</option>
          ))}
        </select>
        <IconChevronDown size={12} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-popim-etiqueta" />
      </div>
      {error && <p role="alert" className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}
