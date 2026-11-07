import { IconSearch } from "@/Componentes/Iconos";

export default function Buscador({ value, onChange, placeholder, className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <IconSearch size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-popim-muted" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-11 w-full rounded-xl border border-popim-linea bg-slate-100 pl-10 pr-3 text-sm text-popim-ink outline-none transition placeholder:text-popim-muted focus:border-popim-primary focus:bg-white focus:ring-4 focus:ring-popim-primary/15"
      />
    </div>
  );
}
