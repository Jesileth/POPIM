
//

"use client";

// MIS CONSULTAS (veterinario): todas las que ha atendido. Las abiertas aparecen primero.
import { useState } from "react";
import Avatar from "@/Componentes/ui/Avatar";
import Aviso from "@/Componentes/ui/Aviso";
import Boton from "@/Componentes/ui/Boton";
import Buscador from "@/Componentes/ui/Buscador";
import EncabezadoVista from "@/Componentes/ui/EncabezadoVista";
import Selector from "@/Componentes/ui/Selector";
import { IconClock } from "@/Componentes/Iconos";
import { notaConsulta, rutaConsulta } from "@/lib/atencion";
import { coincide } from "@/lib/busqueda";
import { hoyISO, sumarDias } from "@/lib/fechas";
import { diaRelativo } from "@/lib/formato";
import { useCarga } from "@/lib/useCarga";
import { obtenerMisConsultas } from "@/servicios/veterinario";

// Periodo → desde qué fecha se muestran (null = todas)
const PERIODOS = [
  { valor: "MES", texto: "Este mes", desde: () => `${hoyISO().slice(0, 8)}01` },
  { valor: "TRES", texto: "Últimos 3 meses", desde: () => sumarDias(hoyISO(), -90) },
  { valor: "TODO", texto: "Todas", desde: () => null },
];

export default function MisConsultasPage() {
  const { datos, error } = useCarga(obtenerMisConsultas, []);
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState("TODAS"); // TODAS · ABIERTAS · FINALIZADAS
  const [periodo, setPeriodo] = useState("MES");

  const todas = datos?.consultas ?? [];
  const abiertas = todas.filter((c) => c.abierta).length;
  const desde = PERIODOS.find((p) => p.valor === periodo).desde();

  const visibles = todas.filter(
    (c) =>
      // Las abiertas siempre se ven, aunque sean de otro mes: hay que finalizarlas
      (c.abierta || !desde || c.inicio.slice(0, 10) >= desde) &&
      (filtro === "TODAS" || (filtro === "ABIERTAS" ? c.abierta : !c.abierta)) &&
      coincide(q, c.mascota.nombre, c.propietario.nombreCompleto, c.diagnostico, c.motivo),
  );

  const pestanas = [
    { valor: "TODAS", texto: "Todas" },
    { valor: "ABIERTAS", texto: `Abiertas (${abiertas})` },
    { valor: "FINALIZADAS", texto: "Finalizadas" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <EncabezadoVista titulo="Mis consultas" descripcion="Todas las consultas que has atendido. Las abiertas aparecen primero." />

      {error && <Aviso tipo="error">{error}</Aviso>}

      {abiertas > 0 && (
        <p className="flex items-center gap-2 rounded-xl border border-amber-300 bg-popim-pendiente px-4 py-3 text-sm text-popim-pendiente-texto">
          <IconClock size={15} className="shrink-0" />
          <span>
            Tienes <strong>{abiertas} {abiertas === 1 ? "consulta abierta" : "consultas abiertas"}</strong>. Recuerda finalizarlas antes de terminar tu turno.
          </span>
        </p>
      )}

      {/* FILTROS */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-popim-linea bg-white p-3">
        <Buscador value={q} onChange={setQ} placeholder="Mascota, propietario o diagnóstico" className="min-w-60 flex-1" />
        <div role="group" aria-label="Filtrar por estado" className="flex rounded-xl bg-popim-page p-1">
          {pestanas.map((p) => (
            <button
              key={p.valor}
              type="button"
              onClick={() => setFiltro(p.valor)}
              aria-pressed={filtro === p.valor}
              className={`h-9 rounded-lg px-3 text-[13px] font-semibold transition ${
                filtro === p.valor ? "bg-white text-popim-ink shadow-sm" : "text-popim-texto hover:text-popim-ink"
              }`}
            >
              {p.texto}
            </button>
          ))}
        </div>
        <Selector
          id="periodo"
          vacio="Periodo"
          className="w-44"
          opciones={PERIODOS.map((p) => ({ valor: p.valor, texto: p.texto }))}
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value || "TODO")}
        />
      </div>

      {/* TABLA */}
      {!datos && !error && <div role="status" aria-label="Cargando" className="h-64 animate-pulse rounded-2xl border border-popim-linea bg-white" />}

      {datos && (
        <div className="overflow-x-auto rounded-2xl border border-popim-linea bg-white">
          <table className="w-full min-w-200 text-left text-sm">
            <thead className="border-b border-popim-linea text-[11px] font-bold uppercase tracking-wide text-popim-texto">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Paciente</th>
                <th className="px-4 py-3">Motivo</th>
                <th className="px-4 py-3">Diagnóstico</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-popim-linea">
              {visibles.map((c) => {
                const nota = notaConsulta(c);
                return (
                  <tr key={c.id}>
                    <td className="px-4 py-3">
                      <p className="font-bold text-popim-ink">{diaRelativo(c.inicio.slice(0, 10))}</p>
                      <p className="text-xs text-popim-muted">{c.inicio.slice(11, 16)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar texto={c.mascota.nombre[0]} tamano="sm" />
                        <div>
                          <p className="font-bold text-popim-ink">{c.mascota.nombre}</p>
                          <p className="text-xs text-popim-muted">{c.propietario.nombreCompleto}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-popim-ink">{c.motivo}</td>
                    <td className={`px-4 py-3 ${c.diagnostico ? "text-popim-ink" : "text-popim-muted"}`}>{c.diagnostico ?? "Pendiente"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          c.abierta ? "bg-estado-curso text-estado-curso-texto" : "bg-estado-finalizada text-estado-finalizada-texto"
                        }`}
                      >
                        {c.abierta ? "En curso" : "Finalizada"}
                      </span>
                      {nota && <p className="mt-1 text-xs text-popim-muted">{nota}</p>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {c.abierta ? (
                        <Boton variante="curso" tamano="sm" href={rutaConsulta(c.id)}>Continuar</Boton>
                      ) : (
                        // Finalizada: se ve en el expediente de la mascota
                        <Boton variante="secundario" tamano="sm" href={`/pacientes?mascota=${c.mascota.id}`}>Ver</Boton>
                      )}
                    </td>
                  </tr>
                );
              })}
              {visibles.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-popim-muted">
                    No hay consultas con esos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}