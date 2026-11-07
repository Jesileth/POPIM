"use client";

// ATENCIÓN DE HOY (veterinario): lo que tiene que atender hoy, en orden de prioridad.
// 1) Resumen en cuadritos · 2) Emergencias · 3) En consulta · 4) Próximas · 5) Atendidas hoy
import Link from "next/link";
import Avatar from "@/Componentes/ui/Avatar";
import Aviso from "@/Componentes/ui/Aviso";
import Boton from "@/Componentes/ui/Boton";
import EncabezadoVista from "@/Componentes/ui/EncabezadoVista";
import Tarjeta from "@/Componentes/ui/Tarjeta";
import TarjetaResumen from "@/Componentes/Citas/TarjetaResumen";
import { IconWarning } from "@/Componentes/Iconos";
import { agruparAtencion, listaEnTexto, rutaConsulta } from "@/lib/atencion";
import { fechaCompleta, fechaHoraCorta } from "@/lib/formato";
import { useCarga } from "@/lib/useCarga";
import { useIniciarConsulta } from "@/lib/useIniciarConsulta";
import { obtenerAtencionHoy } from "@/servicios/veterinario";

const hora = (h) => h.slice(0, 5); // "09:00:00" → "09:00"
const PRIORIDAD = {
  CRITICA: { texto: "Crítica", clases: "bg-estado-emergencia text-white" },
  URGENTE: { texto: "Urgente", clases: "bg-amber-500 text-white" },
};

export default function AtencionHoyPage() {
  const { datos, error } = useCarga(obtenerAtencionHoy, []);
  const { iniciar, iniciando, error: errorIniciar } = useIniciarConsulta();

  if (error) return <Aviso tipo="error">{error}</Aviso>;
  if (!datos) {
    return <div role="status" aria-label="Cargando" className="h-72 animate-pulse rounded-2xl border border-popim-linea bg-white" />;
  }

  const { emergencias, enConsulta, proximas, atendidas } = agruparAtencion(datos.citas);
  const confirmadas = proximas.filter((c) => c.estadoId === 502);
  const sinConfirmar = proximas.filter((c) => c.estadoId === 501);
  const porAtender = emergencias.length + confirmadas.length;
  const primera = enConsulta[0];

  return (
    <div className="flex flex-col gap-5">
      <EncabezadoVista subtitulo={fechaCompleta(datos.fecha)} titulo="Atención de hoy" />

      {errorIniciar && <Aviso tipo="error">{errorIniciar}</Aviso>}

      {/* 1. RESUMEN */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <TarjetaResumen
          punto="bg-popim-primary"
          titulo="Por atender"
          valor={porAtender}
          pie={emergencias.length > 0 ? `${emergencias.length} ${emergencias.length === 1 ? "es emergencia" : "son emergencias"}` : "Sin emergencias"}
        />
        <TarjetaResumen
          punto="bg-estado-curso-borde"
          titulo="En consulta"
          valor={enConsulta.length}
          pie={primera ? `${primera.mascota.nombre}, desde ${primera.consulta.iniciadaA}` : "Ninguna abierta"}
        />
        <TarjetaResumen punto="bg-estado-finalizada-borde" titulo="Atendidas" valor={atendidas.length} pie="Finalizadas hoy" />
        <TarjetaResumen punto="bg-amber-500" titulo="Sin confirmar" valor={sinConfirmar.length} pie="Recepción aún no la confirma" />
      </div>

      {/* 2. EMERGENCIAS (solo si hay) */}
      {emergencias.length > 0 && (
        <section aria-labelledby="titulo-emergencias" className="rounded-2xl border border-estado-cancelada-borde/40 bg-estado-cancelada/60 p-4">
          <h2 id="titulo-emergencias" className="mb-3 flex items-center gap-2 font-bold text-estado-emergencia">
            <IconWarning size={16} /> Emergencia
          </h2>
          <div className="space-y-2.5">
            {emergencias.map((c) => (
              <article key={c.id} className="flex flex-wrap items-center gap-4 rounded-xl bg-white p-4">
                <Avatar texto={c.mascota.nombre[0]} tono="emergencia" />
                <div className="min-w-48 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-base font-bold text-popim-ink">
                    {c.mascota.nombre}
                    {PRIORIDAD[c.prioridad] && (
                      <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ${PRIORIDAD[c.prioridad].clases}`}>
                        {PRIORIDAD[c.prioridad].texto}
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-popim-texto">
                    {[c.mascota.especie, c.mascota.raza, c.mascota.edad, c.motivo].filter(Boolean).join(" · ")}
                  </p>
                  <p className="text-xs text-popim-muted">
                    {c.personaPresentador ? `La trae ${c.personaPresentador}` : `La trae ${c.propietario.nombreCompleto}`}
                    {` · registrada ${c.registradaA}`}
                  </p>
                </div>
                <Boton variante="urgente" disabled={iniciando === c.id} onClick={() => iniciar(c.id)}>
                  {iniciando === c.id ? "Abriendo…" : "Atender ahora"}
                </Boton>
              </article>
            ))}
          </div>
        </section>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-5">
          {/* 3. EN CONSULTA */}
          <Tarjeta titulo="En consulta">
            {enConsulta.length === 0 && <p className="text-sm text-popim-muted">No tienes consultas abiertas.</p>}
            <div className="space-y-2.5">
              {enConsulta.map((c) => (
                <article key={c.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-estado-curso-borde/50 bg-estado-curso/50 p-3.5">
                  <Avatar texto={c.mascota.nombre[0]} tono="curso" />
                  <div className="min-w-48 flex-1">
                    <p className="font-bold text-popim-ink">
                      {c.mascota.nombre} <span className="font-normal text-popim-texto">· {hora(c.horaInicio)}</span>
                    </p>
                    <p className="text-[13px] text-popim-texto">
                      {[c.mascota.especie, c.mascota.raza, c.motivo].filter(Boolean).join(" · ")}
                    </p>
                    <p className="text-xs font-semibold text-estado-curso-texto">
                      Iniciada a las {c.consulta.iniciadaA}
                      {c.consulta.faltan.length > 0 && ` · faltan ${listaEnTexto(c.consulta.faltan)}`}
                    </p>
                  </div>
                  <Boton variante="curso" href={rutaConsulta(c.consulta.id)}>Continuar</Boton>
                </article>
              ))}
            </div>
          </Tarjeta>

          {/* 4. PRÓXIMAS */}
          <Tarjeta>
            <h2 className="text-base font-bold text-popim-ink">Próximas</h2>
            <p className="mb-4 text-xs text-popim-muted">Citas confirmadas, en orden de hora.</p>
            {proximas.length === 0 && <p className="text-sm text-popim-muted">No te quedan citas hoy.</p>}
            <div className="space-y-2.5">
              {proximas.map((c) => {
                const porConfirmar = c.estadoId === 501;
                return (
                  <article
                    key={c.id}
                    className={`flex flex-wrap items-center gap-4 rounded-xl border border-popim-linea p-3.5 ${porConfirmar ? "bg-popim-page" : "bg-white"}`}
                  >
                    <span className="w-12 text-base font-bold text-popim-ink">{hora(c.horaInicio)}</span>
                    <Avatar texto={c.mascota.nombre[0]} tamano="sm" />
                    <div className="min-w-48 flex-1">
                      <p className="font-bold text-popim-ink">
                        {c.mascota.nombre}{" "}
                        <span className="text-xs font-normal text-popim-texto">
                          · {[c.mascota.especie, c.mascota.raza].filter(Boolean).join(" · ")}
                        </span>
                      </p>
                      <p className="text-[13px] text-popim-texto">{c.motivo} · {c.propietario.nombreCompleto}</p>
                    </div>
                    {porConfirmar ? (
                      <span className="rounded-full bg-popim-pendiente px-2.5 py-1 text-[11px] font-semibold text-popim-pendiente-texto">
                        Por confirmar
                      </span>
                    ) : (
                      <Boton tamano="sm" disabled={iniciando === c.id} onClick={() => iniciar(c.id)}>
                        {iniciando === c.id ? "Abriendo…" : "Iniciar consulta"}
                      </Boton>
                    )}
                  </article>
                );
              })}
            </div>
          </Tarjeta>
        </div>

        {/* 5. ATENDIDAS HOY */}
        <Tarjeta titulo="Atendidas hoy">
          {atendidas.length === 0 && <p className="text-sm text-popim-muted">Todavía no finalizas ninguna consulta.</p>}
          <div className="space-y-2.5">
            {atendidas.map((c) => (
              <article key={c.id} className="rounded-xl border border-popim-linea p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-popim-ink">{c.mascota.nombre} · {hora(c.horaInicio)}</p>
                  <span className="rounded-full border border-estado-finalizada-borde/40 bg-estado-finalizada px-2 py-0.5 text-[11px] font-semibold text-estado-finalizada-texto">
                    Finalizada
                  </span>
                </div>
                <p className="mt-1 text-[13px] text-popim-texto">
                  {c.motivo}
                  {c.consulta.diagnostico && ` · Dx: ${c.consulta.diagnostico}`}
                </p>
                {c.consulta.control && (
                  <p className="text-xs text-popim-muted">
                    Control programado: {fechaHoraCorta(`${c.consulta.control.fecha}T${c.consulta.control.hora}`)}
                  </p>
                )}
                {/* La pantalla Pacientes se hace en el paso 5; por ahora este enlace cae en "En construcción" */}
                <Link href={`/pacientes?mascota=${c.mascota.id}`} className="mt-2 inline-block text-[13px] font-semibold text-popim-primary hover:underline">
                  Ver en expediente →
                </Link>
              </article>
            ))}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-popim-muted">
            Una consulta finalizada ya no se edita. Solo puedes agregarle exámenes desde el expediente.
          </p>
        </Tarjeta>
      </div>
    </div>
  );
}
