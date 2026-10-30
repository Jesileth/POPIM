"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import FilaExamen from "@/Componentes/FilaExamen";
import InsigniaCita from "@/Componentes/InsigniaCita";
import Mensaje from "@/Componentes/Mensaje";
import TarjetaSeccion from "@/Componentes/TarjetaSeccion";
import { IconArrowLeft, IconCapsule, IconChevronRight, IconShieldPlus,IconFilePdf } from "@/Componentes/Iconos";
import { listarCitas } from "@/servicios/citas";
import { listarConsultasMascota, listarExamenesMascota, obtenerCartilla, obtenerMascota,subirFotoMascota, quitarFotoMascota
} from "@/servicios/mascotas";
import { useCarga } from "@/lib/useCarga";
import { formatearEdad, formatearFecha, formatearHora } from "@/lib/formato";
import { CLINICAS } from "@/lib/mockPortal";
import BotonDescarga from "@/Componentes/BotonDescarga";
import SelectorFoto from "@/Componentes/SelectorFoto";
import { descargarReporteSalud } from "@/lib/pdf";



const PESTANAS = [
  { id: "resumen", texto: "Resumen" },
  { id: "cartilla", texto: "Cartilla" },
  { id: "historial", texto: "Historial clínico" },
  { id: "examenes", texto: "Exámenes" },
]; 
  

const ACTIVAS = ["SOLICITADA", "CONFIRMADA", "ATENCION"];

const Cargando = () => (
  <div role="status" aria-label="Cargando" className="h-40 animate-pulse rounded-2xl border border-popim-linea bg-white" />
);

const obtenerNombreClinica = (clinicaId) => {
  const clinica = CLINICAS.find((c) => c.id === clinicaId);
  return clinica ? clinica.nombreComercial : "";
};


function VolverAMascotas() {
  return (
    <Link href="/mis-mascotas" className="inline-flex items-center gap-1.5 text-sm font-semibold text-popim-primary hover:underline">
      <IconArrowLeft size={14} />
      Mis mascotas
    </Link>
  );
}

// ---------- Pestaña: Resumen ----------
function Resumen({ mascota }) {
  const { datos } = useCarga(listarCitas, null);
  const proximas = (datos?.citas ?? [])
    .filter((c) => c.mascota.id === mascota.id && ACTIVAS.includes(c.estado.codigo))
    .sort((a, b) => `${a.fecha}${a.horaInicio}`.localeCompare(`${b.fecha}${b.horaInicio}`));

  const filas = [
    ["Código único", mascota.codigoUnico],
    ["Especie", mascota.especie.nombre],
    ["Raza", mascota.raza?.nombre ?? "Mestizo"],
    ["Sexo", mascota.sexo === "MACHO" ? "Macho" : "Hembra"],
    ["Edad", formatearEdad(mascota.edadActualMeses)],
    ["Fecha de nacimiento", mascota.fechaNacimiento ? formatearFecha(mascota.fechaNacimiento) : "No registrada"],
    ["Registrada el", formatearFecha(mascota.fechaRegistro.slice(0, 10))],
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <TarjetaSeccion titulo="Datos básicos">
        <dl className="divide-y divide-popim-linea text-sm">
          {filas.map(([etiqueta, valor]) => (
            <div key={etiqueta} className="flex justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
              <dt className="text-popim-etiqueta">{etiqueta}</dt>
              <dd className="text-right font-medium text-popim-ink">{valor}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-xs text-popim-muted">
          Los datos básicos, una vez guardados, no pueden ser editados.
        </p>
      </TarjetaSeccion>

      <TarjetaSeccion
        titulo="Próximas citas"
        acciones={
          <Link href="/solicitar-cita" className="text-xs font-semibold text-popim-primary hover:underline">
            Solicitar cita
          </Link>
        }
      >
        {proximas.length === 0 ? (
          <p className="text-sm text-popim-muted">No hay citas próximas para {mascota.nombre}.</p>
        ) : (
          <ul className="divide-y divide-popim-linea">
            {proximas.map((cita) => (
              <li key={cita.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-popim-ink">
                    {formatearFecha(cita.fecha)} · {formatearHora(cita.horaInicio)}
                  </p>
                  <p className="truncate text-xs text-popim-muted">
                    {cita.veterinario.nombreCompleto} · {cita.motivoConsulta}
                  </p>
                </div>
                <InsigniaCita estado={cita.estado} />
              </li>
            ))}
          </ul>
        )}
      </TarjetaSeccion>
    </div>
  );
}

// ---------- Pestaña: Cartilla de vacunación y desparasitación ----------
function Cartilla({ mascota }) {
  const { datos, error } = useCarga(obtenerCartilla, mascota.id);
  
  if (error) return <Mensaje tipo="error">{error}</Mensaje>;
  if (!datos) return <Cargando />;

  const dosis = datos.dosis;
  const vencidas = dosis.filter((d) => d.estado.codigo === "VENCIDA").length;
  const grupos = [
    { tipo: "VACUNA", titulo: "Vacunas", icono: IconShieldPlus },
    { tipo: "DESPARASITANTE", titulo: "Desparasitación", icono: IconCapsule },
  ];

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <BotonDescarga icono={IconFilePdf} onDescargar={() => descargarReporteSalud(mascota, dosis)}>
          Reporte de salud (PDF)
        </BotonDescarga>
      </div>
      {vencidas > 0 && 
      (
        <Mensaje tipo="aviso">
          {vencidas === 1 ? "Tienes 1 dosis vencida." : `Tienes ${vencidas} dosis vencidas.`} Solicita una cita para ponerla al día.
        </Mensaje>
      )}

      {grupos.map((grupo) => {
        const filas = dosis
          .filter((d) => d.producto.tipo === grupo.tipo)
          .sort((a, b) => a.fechaProgramada.localeCompare(b.fechaProgramada));

        return (
          <TarjetaSeccion key={grupo.tipo} titulo={grupo.titulo} icono={grupo.icono}>
            {filas.length === 0 ? (
              <p className="text-sm text-popim-muted">Aún no hay registros en esta sección.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-136 text-left text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-wide text-popim-etiqueta">
                      <th className="pb-2 pr-4 font-semibold">Producto</th>
                      <th className="pb-2 pr-4 font-semibold">Programada</th>
                      <th className="pb-2 pr-4 font-semibold">Aplicada</th>
                      <th className="pb-2 pr-4 text-center font-semibold">Estado</th>
                      <th className="pb-2 pr-4 font-semibold">Clinica</th>
                      <th className="pb-2 font-semibold">Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-popim-linea">
                    {filas.map((fila) => (
                      <tr key={fila.id}>
                        <td className="py-3 pr-4 font-semibold text-popim-ink">{fila.producto.nombre}</td>
                        <td className="py-3 pr-4 text-popim-texto">{formatearFecha(fila.fechaProgramada)}</td>
                        <td className="py-3 pr-4 text-popim-texto">
                          {fila.fechaAplicada ? formatearFecha(fila.fechaAplicada) : "—"}
                        </td>

                        <td className="py-3 pr-4 text-center">
                          <InsigniaCita estado={fila.estado} />
                        </td>

                        <td className="py-3 text-xs text-popim-muted">{obtenerNombreClinica(fila.clinicaId)}</td>
                       
                        <td className="py-3 text-xs text-popim-muted">
                          {[fila.lote && `Lote ${fila.lote}`, fila.aplicadaPor, fila.observaciones]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TarjetaSeccion>
        );
      })}
    </div>
  );
}


// ---------- Pestaña: Historial clínico (por consulta, incluye emergencias sin cita) ----------
function Historial({ mascotaId }) {
  const { datos, error } = useCarga(listarConsultasMascota, mascotaId);
  if (error) return <Mensaje tipo="error">{error}</Mensaje>;
  if (!datos) return <Cargando />;
  if (datos.consultas.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-popim-borde bg-white p-8 text-center text-sm text-popim-muted">
        Aún no hay consultas en el historial. Cuando una cita sea atendida, su consulta aparecerá aquí.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-popim-linea overflow-hidden rounded-2xl border border-popim-linea bg-white">
      {datos.consultas.map((c) => (
        <li key={c.id}>
          <Link
            href={`/consultas/${c.id}`}
            className="flex flex-col gap-2 p-4 transition hover:bg-popim-page sm:flex-row sm:items-center sm:gap-5 sm:p-5"
          >
            <span className="shrink-0 text-sm font-medium text-popim-texto sm:w-40">
              {formatearFecha(c.fechaInicio.slice(0, 10))}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold text-popim-ink">
                {c.esEmergencia ? "Atención de emergencia" : (c.motivo ?? "Consulta")}
              </p>
              <p className="mt-0.5 text-xs text-popim-muted">
                {c.veterinario ? `Con ${c.veterinario.nombreCompleto}` : "Sin veterinario registrado"}
                {" · "}
                {c.totalDiagnosticos} {c.totalDiagnosticos === 1 ? "diagnóstico" : "diagnósticos"}
                {c.tieneReceta ? " · Receta" : ""}
                {c.totalExamenes > 0 ? ` · ${c.totalExamenes} ${c.totalExamenes === 1 ? "examen" : "exámenes"}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {c.esEmergencia && (
                <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700 ring-1 ring-inset ring-red-200">
                  Emergencia
                </span>
              )}
              <span className="flex items-center gap-1 text-xs font-semibold text-popim-primary">
                Ver detalle <IconChevronRight size={12} />
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

// ---------- Pestaña: Exámenes ----------
function Examenes({ mascotaId }) {
  const { datos, error } = useCarga(listarExamenesMascota, mascotaId);
  if (error) return <Mensaje tipo="error">{error}</Mensaje>;
  if (!datos) return <Cargando />;
  if (datos.examenes.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-popim-borde bg-white p-8 text-center text-sm text-popim-muted">
        Todavía no hay resultados de exámenes. Cuando la clínica los cargue, podrás descargarlos aquí.
      </p>
    );
  }

  return (
    <TarjetaSeccion titulo="Resultados de exámenes">
      <ul className="divide-y divide-popim-linea">
        {datos.examenes.map((examen) => (
          <FilaExamen key={examen.id} examen={examen} mostrarConsulta />
        ))}
      </ul>
    </TarjetaSeccion>
  );
}

// ---------- Página ----------
export default function FichaMascotaPage() {
  const { id } = useParams();
  const { datos, error } = useCarga(obtenerMascota, id);

  const [pestana, setPestana] = useState("resumen");
  const mascota = datos?.mascota;

const [fotoLocal, setFotoLocal] = useState(undefined);

  async function subirFoto(archivo) {
    const respuesta = await subirFotoMascota(id, archivo);
    if (respuesta.ok) setFotoLocal(respuesta.datos.url);
    return respuesta;
  }

  async function quitarFoto() {
    const respuesta = await quitarFotoMascota(id);
    if (respuesta.ok) setFotoLocal(null);
    return respuesta;
  }


  if (error) {
    return (
      <>
        <VolverAMascotas />
        <div className="mt-6">
          <Mensaje tipo="error">{error}</Mensaje>
        </div>
      </>
    );
  }
  if (!mascota) return <Cargando />;

  return (
    <>
      <VolverAMascotas />

      <header className="mt-4 flex flex-col gap-4 border-b border-popim-linea pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <SelectorFoto
            nombre={mascota.nombre}
            fotoUrl={fotoLocal !== undefined ? fotoLocal : mascota.fotoUrl}
            tamano={72}
            mostrarAcciones={false}
            onSubir={subirFoto}
            onQuitar={quitarFoto}
          />
          <div>
            <h1 className="text-3xl font-bold text-popim-ink">{mascota.nombre}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-popim-muted">
              <span className="rounded-md bg-popim-info px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wide text-popim-primary">
                {mascota.codigoUnico}
              </span>
              <span>
                {mascota.especie.nombre} · {mascota.raza?.nombre ?? "Mestizo"}
              </span>
              <span>{formatearEdad(mascota.edadActualMeses)}</span>
            </div>
          </div>
        </div>
        <Link
          href="/solicitar-cita"
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-popim-primary px-5 text-sm font-semibold text-white shadow-lg shadow-popim-primary/25 transition hover:bg-popim-primary-dark"
        >
          Solicitar cita
        </Link>
      </header>

      <div role="tablist" aria-label="Secciones de la ficha" className="mt-6 flex gap-1 overflow-x-auto border-b border-popim-linea">
        {PESTANAS.map((item) => (
          <button
            key={item.id}
            id={`tab-${item.id}`}
            type="button"
            role="tab"
            aria-selected={pestana === item.id}
            aria-controls={`panel-${item.id}`}
            onClick={() => setPestana(item.id)}
            className={`-mb-px shrink-0 border-b-2 px-4 py-3 text-sm font-semibold transition ${
              pestana === item.id
                ? "border-popim-primary text-popim-primary"
                : "border-transparent text-popim-muted hover:text-popim-ink"
            }`}
          >
            {item.texto}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${pestana}`} aria-labelledby={`tab-${pestana}`} className="mt-6">
        {pestana === "resumen" && <Resumen mascota={mascota} />}
        {pestana === "cartilla" && <Cartilla mascota={mascota} />}
        {pestana === "historial" && <Historial mascotaId={mascota.id} />}
        {pestana === "examenes" && <Examenes mascotaId={mascota.id} />}
      </div>
    </>
  );
}