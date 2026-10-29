import { iniciales } from "@/lib/formato";

export default function Avatar({ nombre, fotoUrl, tamano = 40, className = "" }) {
  const estilo = { width: tamano, height: tamano, fontSize: Math.round(tamano * 0.38) };

  if (fotoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={fotoUrl} alt="" style={estilo} className={`shrink-0 rounded-full object-cover ${className}`} />;
  }
  return (
    <span
      style={estilo}
      className={`flex shrink-0 items-center justify-center rounded-full bg-popim-info font-bold text-popim-primary ${className}`}
    >
      {iniciales(nombre)}
    </span>
  );
}