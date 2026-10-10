// es la cajita de aviso del prototipo de recuperar, más una versión de error

export default function Mensaje({ tipo = "aviso", children }) {
  const estilos =
    tipo === "error"
      ? "border-red-700/40 bg-red-50 text-red-800"
      : "border-popim-aviso-borde bg-popim-aviso text-popim-ink";

  return (
    <div
      role={tipo === "error" ? "alert" : "status"}
      className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${estilos}`}
    >
      {tipo === "aviso" && (
        <svg
          viewBox="0 0 24 24"
          className="mt-px h-4 w-4 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="13" r="8" />
          <path d="M12 9v4l2 2M9 3h6" />
        </svg>
      )}
      <p>{children}</p>
    </div>
  );
}