//

"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Aviso from "@/Componentes/ui/Aviso";
import Boton from "@/Componentes/ui/Boton";
import Buscador from "@/Componentes/ui/Buscador";
import EncabezadoVista from "@/Componentes/ui/EncabezadoVista";
import Modal from "@/Componentes/ui/Modal";
import Selector from "@/Componentes/ui/Selector";
import { IconPlus } from "@/Componentes/Iconos";
import { iniciales } from "@/lib/formato";
import { useCarga } from "@/lib/useCarga";
import { cambiarEstadoClinica, listarClinicas } from "@/servicios/super";

const FILTROS_ESTADO = [
  { valor: "ACTIVAS", texto: "Activas" },
  { valor: "INACTIVAS", texto: "Inactivas" },
];

// Interruptor verde (activa) / gris (inactiva)
function Interruptor({ activa, onClick, etiqueta, deshabilitado }) {
  return (
    <button type="button" role="switch" aria-checked={activa} aria-label={etiqueta} onClick={onClick} disabled={deshabilitado}
      className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-50 ${activa ? "bg-emerald-600" : "bg-slate-400"}`}>
      <span className={`absolute top-0.75 h-5.5 w-5.5 rounded-full bg-white shadow transition-all ${activa ? "left-5.75" : "left-0.75"}`} />
    </button>
  );
}

function Contenido() {
  const parametros = useSearchParams();
  const [texto, setTexto] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("");
  const [porDesactivar, setPorDesactivar] = useState(null); // clínica del cuadro de confirmación
  const [cambiando, setCambiando] = useState(null); // id de la clínica que se está guardando
  const [mensaje, setMensaje] = useState(() => {
    const registrada = parametros.get("registrada");
    return registrada ? { tipo: "ok", texto: `La clínica «${registrada}» quedó registrada.` } : null;
  });

  // Espera a que deje de escribir (350 ms) para no pedirle al servidor una búsqueda por cada letra
  useEffect(() => {
    const espera = setTimeout(() => setBusqueda(texto), 350);
    return () => clearTimeout(espera);
  }, [texto]);

  const { datos, error, cargando, recargar } = useCarga(() => listarClinicas({ q: busqueda, estado }), [busqueda, estado]);
  const clinicas = datos?.clinicas ?? [];

  async function cambiarEstado(clinica, activa) {
    setCambiando(clinica.id);
    const respuesta = await cambiarEstadoClinica(clinica.id, activa);
    setCambiando(null);
    setPorDesactivar(null);
    if (!respuesta.ok) {
      setMensaje({ tipo: "error", texto: respuesta.error });
      return;
    }
    setMensaje({ tipo: "ok", texto: `«${clinica.nombreComercial}» ahora está ${activa ? "activa" : "inactiva"}.` });
    recargar();
  }

  // Activar es directo; inactivar pide confirmación porque bloquea la clínica al instante
  function alPulsarInterruptor(clinica) {
    if (clinica.activa) setPorDesactivar(clinica);
    else cambiarEstado(clinica, true);
  }

  return (
    <div className="flex flex-col gap-6">
      <EncabezadoVista
        subtitulo="Clínicas › Consulta de clínicas"
        titulo="Clínicas de la red"
        descripcion="Una clínica inactiva deja de verse para los propietarios y no recibe citas nuevas desde ese momento."
      >
        <Boton href="/super/clinicas/nueva"><IconPlus size={16} /> Registrar clínica</Boton>
      </EncabezadoVista>

      {mensaje && <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>}

      <div className="flex flex-col gap-3 rounded-2xl border border-popim-linea bg-white p-4 sm:flex-row sm:items-center">
        <Buscador value={texto} onChange={setTexto} placeholder="Buscar por nombre, razón social o RUC" className="flex-1" />
        <Selector id="estado" opciones={FILTROS_ESTADO} vacio="Todas las clínicas" value={estado}
          onChange={(e) => setEstado(e.target.value)} className="sm:w-56" />
      </div>

      {error && <Aviso tipo="error">{error}</Aviso>}

      <section className="overflow-x-auto rounded-2xl border border-popim-linea bg-white">
        <table className="w-full min-w-[60rem] text-left text-sm">
          <thead className="border-b border-popim-linea text-xs uppercase tracking-wide text-popim-texto">
            <tr>
              <th scope="col" className="px-5 py-3 font-bold">Clínica</th>
              <th scope="col" className="px-3 py-3 font-bold">RUC</th>
              <th scope="col" className="px-3 py-3 font-bold">Administrador</th>
              <th scope="col" className="px-3 py-3 text-right font-bold">Personal</th>
              <th scope="col" className="px-3 py-3 text-right font-bold">Citas del mes</th>
              <th scope="col" className="px-3 py-3 font-bold">Estado</th>
              <th scope="col" className="px-5 py-3"><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-popim-linea">
            {cargando && (
              <tr><td colSpan={7} className="px-5 py-8 text-center text-popim-texto">Cargando clínicas…</td></tr>
            )}
            {!cargando && clinicas.length === 0 && !error && (
              <tr><td colSpan={7} className="px-5 py-8 text-center text-popim-texto">No hay clínicas con esos filtros.</td></tr>
            )}
            {!cargando && clinicas.map((c) => (
              <tr key={c.id} className="align-middle">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    {c.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.logoUrl} alt="" className="h-10 w-10 rounded-xl border border-popim-linea object-cover" />
                    ) : (
                      <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-popim-linea bg-popim-info text-xs font-extrabold text-popim-primary">
                        {iniciales(c.nombreComercial)}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-popim-ink">{c.nombreComercial}</p>
                      <p className="text-xs text-popim-texto">{c.razonSocial} · {c.direccion}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 font-mono text-[13px] text-popim-ink">{c.ruc}</td>
                <td className="px-3 py-3">
                  {c.administrador ? (
                    <>
                      <p className="text-popim-ink">{c.administrador.nombreCompleto}</p>
                      {c.administrador.estado === "PENDIENTE" && (
                        <p className="text-xs font-semibold text-popim-pendiente-texto">Aún no activa su cuenta</p>
                      )}
                    </>
                  ) : (
                    <p className="font-semibold text-red-700">Sin administrador activo</p>
                  )}
                </td>
                <td className="px-3 py-3 text-right text-popim-ink">{c.personalActivo}</td>
                <td className="px-3 py-3 text-right text-popim-ink">{c.citasMes}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2.5">
                    <Interruptor activa={c.activa} onClick={() => alPulsarInterruptor(c)}
                      etiqueta={`${c.nombreComercial}: clínica activa`} deshabilitado={cambiando === c.id} />
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${c.activa ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>
                      {c.activa ? "Activa" : "Inactiva"}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3 text-right">
                  <Boton variante="enlace" href={`/super/clinicas/${c.id}`}>Editar</Boton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {porDesactivar && (
        <Modal
          titulo={`¿Inactivar ${porDesactivar.nombreComercial}?`}
          onCerrar={() => setPorDesactivar(null)}
          pie={
            <>
              <Boton variante="neutro" onClick={() => setPorDesactivar(null)}>Cancelar</Boton>
              <Boton variante="emergencia" disabled={cambiando === porDesactivar.id}
                onClick={() => cambiarEstado(porDesactivar, false)}>
                {cambiando === porDesactivar.id ? "Inactivando…" : "Inactivar clínica"}
              </Boton>
            </>
          }
        >
          <ul className="flex list-disc flex-col gap-2 pl-5 text-sm leading-relaxed text-popim-texto">
            <li>Deja de aparecer para los propietarios y no se pueden pedir citas nuevas desde este momento.</li>
            <li>Su personal no podrá entrar al portal mientras esté inactiva.</li>
            <li>
              Tiene <strong className="text-popim-ink">{porDesactivar.citasFuturas} citas pendientes</strong> (solicitadas o
              confirmadas). No se borran: avísale a la clínica antes de inactivarla.
            </li>
            <li>Puedes volver a activarla cuando quieras.</li>
          </ul>
        </Modal>
      )}
    </div>
  );
}

// useSearchParams necesita Suspense (si no, "pnpm build" falla)
export default function ConsultaClinicasPage() {
  return <Suspense fallback={null}><Contenido /></Suspense>;
}