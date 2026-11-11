"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Avatar from "@/Componentes/ui/Avatar";
import Aviso from "@/Componentes/ui/Aviso";
import Boton from "@/Componentes/ui/Boton";
import Buscador from "@/Componentes/ui/Buscador";
import EncabezadoVista from "@/Componentes/ui/EncabezadoVista";
import Paso from "@/Componentes/ui/Paso";
import CamposMascota, { MASCOTA_VACIA, validarMascota } from "@/Componentes/mascotas/CamposMascota";
import { coincide } from "@/lib/busqueda";
import { iniciales } from "@/lib/formato";
import { useCarga } from "@/lib/useCarga";
import { listarPropietarios } from "@/servicios/propietarios";
import { registrarMascota } from "@/servicios/mascotas";

function Contenido() {
  const router = useRouter();
  const params = useSearchParams();
  const { datos } = useCarga(listarPropietarios, []);
  const [q, setQ] = useState("");
  const [selId, setSelId] = useState(params.get("propietario") || "");
  const [m, setM] = useState(MASCOTA_VACIA);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [guardando, setGuardando] = useState(false);

  const todos = datos?.propietarios ?? [];
  const elegido = todos.find((p) => p.id === selId);
  const lista = todos.filter((p) => coincide(q, p.nombreCompleto, p.cedula, p.telefono, p.correo)).slice(0, 6);
  const sigla = (p) => iniciales(p.nombreCompleto);

  async function guardar() {
    const err = validarMascota(m);
    setErrores(err);
    setErrorGeneral("");
    if (Object.values(err).some(Boolean)) return;
    setGuardando(true);
    const r = await registrarMascota(elegido.id, m);
    setGuardando(false);
    if (!r.ok) return setErrorGeneral(r.error);
    router.push(`/mascotas?id=${r.datos.mascota.id}`);
  }

  return (
    <>
      <EncabezadoVista titulo="Registrar mascota"
        descripcion={<>Para un propietario que ya está registrado. Si es nuevo, usa <Boton variante="enlace" href="/propietarios/registrar" className="font-semibold underline">Registrar propietario</Boton>.</>} />
      <div className="mt-5 max-w-4xl space-y-5">
        <Paso numero="1" titulo="Propietario">
          {elegido ? (
            <div className="flex items-center gap-3 rounded-xl border border-popim-primary bg-popim-info/60 p-3">
              <Avatar texto={sigla(elegido)} tono="oscuro" />
              <div className="flex-1 text-sm"><b className="text-popim-ink">{elegido.nombreCompleto}</b><br /><span className="text-popim-muted">{elegido.telefono} · {elegido.totalMascotas} mascotas</span></div>
              <Boton variante="enlace" onClick={() => { setSelId(""); setM(MASCOTA_VACIA); }}>Cambiar</Boton>
            </div>
          ) : (
            <>
              <Buscador value={q} onChange={setQ} placeholder="Nombre, cédula, teléfono o correo" />
              <ul className="mt-3 space-y-2">
                {lista.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 rounded-xl border border-popim-linea p-3">
                    <Avatar texto={sigla(p)} tono="oscuro" />
                    <div className="flex-1 text-sm leading-tight"><b className="text-popim-ink">{p.nombreCompleto}</b><br /><span className="text-xs text-popim-muted">{p.telefono} · {p.totalMascotas} {p.totalMascotas === 1 ? "mascota" : "mascotas"}</span></div>
                    <Boton variante="secundario" tamano="sm" onClick={() => setSelId(p.id)}>Elegir</Boton>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Paso>

        <Paso numero="2" titulo="Datos de la mascota" deshabilitado={!elegido}>
          {!elegido ? <p className="text-sm text-popim-muted">Primero elige al propietario.</p> : (
            <>
              <CamposMascota datos={m} onCambio={setM} errores={errores} />
              {errorGeneral && <div className="mt-4"><Aviso tipo="error">{errorGeneral}</Aviso></div>}
              <p className="mt-4 text-xs text-popim-muted">El sistema asignará el código único de la mascota al guardar.</p>
              <div className="mt-4 flex gap-3">
                <Boton onClick={guardar} disabled={guardando}>{guardando ? "Guardando..." : "Guardar mascota"}</Boton>
                <Boton variante="neutro" href="/mascotas">Cancelar</Boton>
              </div>
            </>
          )}
        </Paso>
      </div>
    </>
  );
}

export default function RegistrarMascotaPage() {
  return <Suspense fallback={null}><Contenido /></Suspense>;
}
