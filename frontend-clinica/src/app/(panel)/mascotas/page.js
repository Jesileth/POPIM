"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Avatar from "@/Componentes/ui/Avatar";
import Aviso from "@/Componentes/ui/Aviso";
import Boton from "@/Componentes/ui/Boton";
import Buscador from "@/Componentes/ui/Buscador";
import EncabezadoVista from "@/Componentes/ui/EncabezadoVista";
import { InsigniaEstado } from "@/Componentes/ui/Insignia";
import Selector from "@/Componentes/ui/Selector";
import Tarjeta from "@/Componentes/ui/Tarjeta";
import { IconLock, IconPlus } from "@/Componentes/Iconos";
import { coincide } from "@/lib/busqueda";
import { fechaDia, formatearEdad } from "@/lib/formato";
import { useCarga } from "@/lib/useCarga";
import { listarMascotas, obtenerMascota } from "@/servicios/mascotas";

function Ficha({ id }) {
  const { datos, error } = useCarga(() => obtenerMascota(id), [id]);
  if (error) return <Aviso tipo="error">{error}</Aviso>;
  if (!datos) return <div role="status" className="h-80 animate-pulse rounded-2xl border border-popim-linea bg-white" />;
  const { mascota: m, propietario: p, citas } = datos;
  const dato = (k, v) => <div><p className="text-xs text-popim-muted">{k}</p><p className="text-lg font-bold text-popim-ink">{v}</p></div>;

  return (
    <div className="space-y-5">
      <Tarjeta>
        <div className="flex flex-col gap-5 md:flex-row md:items-center">
          <Avatar texto={m.nombre[0]} tamano="xxl" />
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold text-popim-ink">{m.nombre}</h2>
              <span className="rounded-lg bg-popim-ink px-2.5 py-1 font-mono text-xs font-bold text-white">{m.codigoUnico}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-4 2xl:grid-cols-4">
              {dato("Especie", m.especie)}{dato("Raza", m.raza)}{dato("Sexo", m.sexo === "MACHO" ? "Macho" : "Hembra")}{dato("Edad", formatearEdad(m.edadActualMeses))}
            </div>
          </div>
          <Boton href="/agenda">Agendar cita</Boton>
        </div>
      </Tarjeta>

      <div className="grid gap-5 2xl:grid-cols-[1fr_300px]">
        <Tarjeta titulo="Citas">
          {citas.length === 0 && <p className="text-sm text-popim-muted">Esta mascota aún no tiene citas.</p>}
          <ul className="divide-y divide-popim-linea">
            {citas.map((c) => (
              <li key={c.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                <span className="w-24 shrink-0 text-sm font-bold text-popim-ink">{fechaDia(c.fecha)}</span>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-popim-ink">{c.motivoConsulta}</p><p className="text-xs text-popim-muted">{c.veterinario.nombreCompleto}</p></div>
                <InsigniaEstado codigo={c.estado} />
              </li>
            ))}
          </ul>
        </Tarjeta>
        <div className="space-y-5">
          <Tarjeta titulo="Propietario">
            <p className="font-bold text-popim-ink">{p.nombreCompleto}</p>
            <p className="text-sm text-popim-muted">{p.telefono}</p>
            <Boton variante="enlace" href={`/propietarios?id=${p.id}`} className="mt-2 font-semibold">Ver propietario →</Boton>
          </Tarjeta>
          <Tarjeta punteada>
            <p className="flex items-center gap-2 font-bold text-popim-ink"><IconLock size={14} /> Información clínica reservada</p>
            <p className="mt-1 text-sm text-popim-muted">Hallazgos, diagnósticos, recetas y exámenes solo los ve el veterinario.</p>
          </Tarjeta>
        </div>
      </div>
    </div>
  );
}

function Contenido() {
  const params = useSearchParams();
  const { datos, error } = useCarga(listarMascotas, []);
  const [q, setQ] = useState("");
  const [especie, setEspecie] = useState("");
  const [sel, setSel] = useState(params.get("id") || "");
  const todas = datos?.mascotas ?? [];
  const especies = [...new Set(todas.map((m) => m.especie))].map((e) => ({ valor: e, texto: e }));
  const lista = todas.filter((m) => coincide(q, m.nombre, m.codigoUnico, m.propietario.nombreCompleto) && (!especie || m.especie === especie));
  const actual = todas.find((m) => m.id === sel) ?? lista[0];

  return (
    <>
      <EncabezadoVista titulo="Consulta de mascotas">
        <Boton href="/mascotas/registrar"><IconPlus size={14} /> Registrar mascota</Boton>
      </EncabezadoVista>
      {error && <div className="mt-4"><Aviso tipo="error">{error}</Aviso></div>}
      <div className="mt-5 grid items-start gap-5 xl:grid-cols-[340px_1fr]">
        <Tarjeta className="space-y-3">
          <Buscador value={q} onChange={setQ} placeholder="Código PET, nombre o propietario" />
          <Selector id="especie" vacio="Todas las especies" opciones={especies} value={especie} onChange={(e) => setEspecie(e.target.value)} />
          <ul className="max-h-80 space-y-1 overflow-y-auto xl:max-h-none">
            {lista.map((m) => (
              <li key={m.id}>
                <button type="button" onClick={() => setSel(m.id)} aria-pressed={actual?.id === m.id}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${actual?.id === m.id ? "border-popim-primary bg-popim-info/60" : "border-transparent hover:bg-popim-page"}`}>
                  <Avatar texto={m.nombre[0]} />
                  <span className="min-w-0 text-sm leading-tight">
                    <b className="text-popim-ink">{m.nombre}</b> <span className="font-mono text-[11px] font-bold text-popim-muted">{m.codigoUnico}</span>
                    <span className="block truncate text-xs text-popim-muted">{m.especie} · {m.propietario.nombreCompleto}</span>
                  </span>
                </button>
              </li>
            ))}
            {datos && lista.length === 0 && <li className="py-4 text-center text-sm text-popim-muted">Sin resultados.</li>}
          </ul>
        </Tarjeta>
        {actual ? <Ficha key={actual.id} id={actual.id} /> : <Tarjeta punteada><p className="text-sm text-popim-muted">Elige una mascota de la lista.</p></Tarjeta>}
      </div>
    </>
  );
}

export default function MascotasPage() {
  return <Suspense fallback={null}><Contenido /></Suspense>;
}
