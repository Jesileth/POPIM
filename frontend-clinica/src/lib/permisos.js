// Ayudas para trabajar con la sesión que devuelve GET /auth/sesion

// ¿El usuario tiene este permiso? (el backend igual lo valida siempre)
export function tienePermiso(sesion, codigo) {
  return Boolean(sesion?.permisos?.includes(codigo));
}

// El menú llega como lista plana (igual que la vista v_menu_usuario).
// Esto lo convierte en árbol: cada opción principal con sus hijos (submenús).
export function armarMenu(lista = []) {
  const normal = lista.map((m) => ({
    id: m.id,
    padreId: m.padreId ?? m.padre_id ?? null, // acepta los dos nombres por si el backend usa snake_case
    etiqueta: m.etiqueta,
    ruta: m.ruta,
    icono: m.icono,
    orden: m.orden ?? 0,
  }));
  const porOrden = (a, b) => a.orden - b.orden;

  return normal
    .filter((m) => m.padreId === null)
    .sort(porOrden)
    .map((padre) => ({
      ...padre,
      hijos: normal.filter((h) => h.padreId === padre.id).sort(porOrden),
    }));
}

// De todas las rutas del menú, cuál corresponde a la página actual.
// Gana la más larga: en /propietarios/registrar gana esa y no /propietarios.
export function rutaActiva(rutas, pathname) {
  return (
    rutas
      .filter((r) => pathname === r || pathname.startsWith(`${r}/`))
      .sort((a, b) => b.length - a.length)[0] ?? null
  );
}

// Nombre de la sección actual, para el encabezado y la pantalla "en construcción"
export function buscarTitulo(lista = [], pathname) {
  if (pathname === "/perfil" || pathname.startsWith("/perfil/")) return "Mi perfil";
  const rutas = lista.map((m) => m.ruta).filter(Boolean);
  const ruta = rutaActiva(rutas, pathname);
  // Si ninguna ruta del menú coincide (ej.: /citas/c1), NO buscamos: los grupos como
  // "Propietarios" tienen ruta null y find() los encontraba por error (null === null).
  if (!ruta) {
    if (pathname.startsWith("/citas/")) return "Detalle de cita";
    return "";
  }
  return lista.find((m) => m.ruta === ruta)?.etiqueta ?? "";
}