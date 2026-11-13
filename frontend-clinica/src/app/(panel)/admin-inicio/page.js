"use client";

import Link from "next/link";
import Aviso from "@/Componentes/ui/Aviso";
import Avatar from "@/Componentes/ui/Avatar";
import EncabezadoVista from "@/Componentes/ui/EncabezadoVista";
import Tarjeta from "@/Componentes/ui/Tarjeta";
import { iniciales } from "@/lib/formato";
import { useCarga } from "@/lib/useCarga";
import { obtenerInicio } from "@/servicios/administrador";

// Cada estado de la cita con su color (los mismos de globals.css que usa la agenda)
const ESTADOS = [
  { campo: "finalizadas", texto: "Finalizada", color: "bg-estado-finalizada-borde" },
  { campo: "enCurso", texto: "En curso", color: "bg-estado-curso-borde" },
  { campo: "confirmadas", texto: "Confirmada", color: "bg-estado-confirmada-borde" },
  { campo: "solicitadas", texto: "Solicitada", color: "bg-estado-solicitada-borde" },
  { campo: "noAsistio", texto: "No asistió", color: "bg-slate-400" },
];

// A dónde lleva cada aviso y qué dice el enlace
const DESTINO_AVISO = {
  BLOQUEADA: { icono: "🔒", enlace: "Desbloquear cuenta", ruta: () => "/admin-personal" },
  BLOQUEO_CON_CITAS: { icono: "⚠️", enlace: "Ver bloqueo", ruta: (a) => `/admin-horarios?persona=${a.personalId}` },
  SIN_ACTIVAR: { icono: "✉️", enlace: "Ver persona", ruta: () => "/admin-personal" },
  SIN_HORARIO: { icono: "◷", enlace: "Asignar horario", ruta: (a) => `/admin-horarios?persona=${a.personalId}` },
};

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

// "2026-11-20T08:00" → "vie 20 nov · 08:00"; si empieza y termina el mismo día: "vie 20 nov · 08:00 – 12:00"
function rangoBloqueo(inicio, fin) {
  const dia = (iso) => new Date(`${iso}:00`).toLocaleDateString("es-NI", { weekday: "short", day: "numeric", month: "short" }).replace(/\./g, "");
  const hora = (iso) => iso.slice(11, 16);
  return inicio.slice(0, 10) === fin.slice(0, 10)
    ? `${dia(inicio)} · ${hora(inicio)} – ${hora(fin)}`
    : `${dia(inicio)} ${hora(inicio)} → ${dia(fin)} ${hora(fin)}`;
}

function TarjetaNumero({ titulo, numero, detalle, alerta }) {
  return (
    <Tarjeta>
      <p className="text-sm font-semibold text-popim-texto">{titulo}</p>
      <p className="mt-1 text-3xl font-extrabold text-popim-ink">{numero}</p>
      <p className="mt-1 text-xs text-popim-texto">{detalle}</p>
      {alerta && (
        <span className="mt-2 inline-block rounded-full bg-popim-pendiente px-2.5 py-1 text-xs font-semibold text-popim-pendiente-texto">
          Requiere atención
        </span>
      )}
    </Tarjeta>
  );
}

function Resumen({ datos }) {
  const { tarjetas: t, porVeterinario, avisos, mes, proximosBloqueos } = datos;
  const mesTexto = new Date(`${datos.hoy}T00:00:00`).toLocaleDateString("es-NI", { month: "long", year: "numeric" });

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <TarjetaNumero titulo="Citas de hoy" numero={t.citasHoy}
          detalle={t.solicitadasHoy > 0 ? `${plural(t.solicitadasHoy, "solicitada espera", "solicitadas esperan")} confirmación` : "Ninguna espera confirmación"} />
        <TarjetaNumero titulo="En consulta ahora" numero={t.enCurso} detalle="Citas en estado En curso" />
        <TarjetaNumero titulo="Personal activo" numero={t.personalActivo}
          detalle={`${plural(t.veterinarios, "veterinario", "veterinarios")} · ${plural(t.recepcionistas, "recepcionista", "recepcionistas")} · ${plural(t.administradores, "administrador", "administradores")}`} />
        <TarjetaNumero titulo="Cuentas bloqueadas" numero={t.cuentasBloqueadas} detalle="Solo tú puedes desbloquearlas" alerta={t.cuentasBloqueadas > 0} />
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.8fr)]">
        <Tarjeta titulo="Citas de hoy por veterinario">
          <p className="-mt-2 mb-4 text-xs text-popim-texto">Cuántas citas tiene cada uno y en qué estado van. Las canceladas no se cuentan.</p>
          <ul className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-popim-texto">
            {ESTADOS.map((e) => (
              <li key={e.campo} className="flex items-center gap-1.5"><span className={`h-3 w-3 rounded-sm ${e.color}`} />{e.texto}</li>
            ))}
          </ul>
          {porVeterinario.length === 0 && <p className="text-sm text-popim-texto">Tu clínica todavía no tiene veterinarios activos.</p>}
          <ul className="flex flex-col gap-4">
            {porVeterinario.map((v) => (
              <li key={v.personalId} className="grid grid-cols-[2.25rem_minmax(7rem,1fr)_minmax(7rem,2fr)_4.5rem] items-center gap-3 text-sm">
                <Avatar texto={iniciales(v.nombreCompleto)} tono="oscuro" tamano="sm" />
                <span className="truncate font-semibold text-popim-ink">{v.nombreCompleto}</span>
                {/* La barra: cada estado ocupa el % de citas que le toca */}
                <div className="flex h-3 overflow-hidden rounded-full bg-slate-100"
                  role="img" aria-label={ESTADOS.map((e) => `${e.texto}: ${v[e.campo]}`).join(", ")}>
                  {v.total > 0 && ESTADOS.map((e) => (
                    <span key={e.campo} className={e.color} style={{ width: `${(v[e.campo] / v.total) * 100}%` }} />
                  ))}
                </div>
                <b className="text-right text-popim-ink">{plural(v.total, "cita", "citas")}</b>
              </li>
            ))}
          </ul>
        </Tarjeta>

        <Tarjeta titulo="Requiere tu atención">
          {avisos.length === 0
            ? <p className="text-sm text-popim-texto">Todo en orden: no hay nada pendiente. 🎉</p>
            : (
              <ul className="flex flex-col divide-y divide-popim-linea">
                {avisos.map((a, i) => {
                  const d = DESTINO_AVISO[a.tipo];
                  return (
                    <li key={`${a.tipo}-${a.personalId}-${i}`} className="py-3 first:pt-0 last:pb-0">
                      <p className="text-sm text-popim-texto"><span aria-hidden="true">{d.icono} </span>{a.texto}</p>
                      <Link href={d.ruta(a)} className="mt-1 inline-block text-sm font-semibold text-popim-primary underline">{d.enlace}</Link>
                    </li>
                  );
                })}
              </ul>
            )}
        </Tarjeta>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <Tarjeta titulo="Este mes">
          <p className="-mt-2 mb-4 text-xs text-popim-texto">{mesTexto.charAt(0).toUpperCase() + mesTexto.slice(1)}, del día 1 a hoy.</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              [mes.atendidas, "Citas atendidas"],
              [mes.emergencias, "Emergencias"],
              [mes.cancelaciones, "Cancelaciones"],
              [mes.propietariosNuevos, "Propietarios nuevos en la clínica"],
            ].map(([n, texto]) => (
              <div key={texto} className="rounded-xl bg-popim-page p-3">
                <p className="text-2xl font-extrabold text-popim-ink">{n}</p>
                <p className="text-xs text-popim-texto">{texto}</p>
              </div>
            ))}
          </div>
        </Tarjeta>

        <Tarjeta titulo="Próximos bloqueos de agenda">
          {proximosBloqueos.length === 0
            ? <p className="text-sm text-popim-texto">No hay bloqueos próximos.</p>
            : (
              <ul className="flex flex-col divide-y divide-popim-linea text-sm">
                {proximosBloqueos.map((b) => (
                  <li key={b.id} className="flex justify-between gap-3 py-2.5 first:pt-0">
                    <span>
                      <b className="text-popim-ink">{b.nombreCompleto}</b><br />
                      <span className="text-popim-texto">{b.motivo}</span>
                    </span>
                    <span className="text-right text-popim-texto">{rangoBloqueo(b.inicio, b.fin)}</span>
                  </li>
                ))}
              </ul>
            )}
          <Link href="/admin-horarios" className="mt-3 inline-block text-sm font-semibold text-popim-primary underline">Gestionar</Link>
        </Tarjeta>
      </div>
    </>
  );
}

export default function InicioAdministrador() {
  const { datos, error, cargando } = useCarga(() => obtenerInicio(), []);
  return (
    <div className="flex flex-col gap-6">
      <EncabezadoVista
        titulo="Inicio"
        descripcion="Resumen de tu clínica para hoy. Los números se calculan a partir de las citas, el personal y los bloqueos registrados."
      />
      {cargando && <p className="text-sm text-popim-texto">Cargando resumen…</p>}
      {error && <Aviso tipo="error">{error}</Aviso>}
      {datos && <Resumen datos={datos} />}
    </div>
  );
}