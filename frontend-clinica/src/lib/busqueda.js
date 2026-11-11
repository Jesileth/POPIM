const normaliza = (s) =>
  (s ?? "").toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[\s-]/g, "");

// coincide("8888", "Carlos", "8888-1234") -> true. Sin texto devuelve true.
export function coincide(texto, ...campos) {
  const n = normaliza(texto);
  return !n || campos.some((c) => normaliza(c).includes(n));
}
