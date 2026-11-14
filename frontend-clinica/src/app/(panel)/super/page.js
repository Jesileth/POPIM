
"use client";

import Link from "next/link";
import Aviso from "@/Componentes/ui/Aviso";
import Boton from "@/Componentes/ui/Boton";
import EncabezadoVista from "@/Componentes/ui/EncabezadoVista";
import Tarjeta from "@/Componentes/ui/Tarjeta";
import { IconCheckCircle, IconLock, IconMail, IconPersonBadge, IconPlus, IconWarning } from "@/Componentes/Iconos";
import { useCarga } from "@/lib/useCarga";
import { obtenerPanel } from "@/servicios/super";

// Cada tipo de alerta del backend → su ícono, colores y a dónde lleva
const ALERTAS = {
  SIN_ADMINISTRADOR: {
    Icono: IconPersonBadge, clase: "bg-amber-50 text-amber-700",
    enlace: (a) => (a.clinicaId ? `/super/clinicas/${a.clinicaId}` : "/super/clinicas"),
    accion: (a) => (a.clinicaId ? "Asignar administrador" : "Ver clínicas"),
  },
  CUENTAS_BLOQUEADAS: {
    Icono: IconLock, clase: "bg-red-50 text-red-700",
    enlace: () => "/super/usuarios", accion: () => "Revisar cuentas",
  },
  ADMINS_PENDIENTES: {
    Icono: IconMail, clase: "bg-popim-info text-popim-primary",
    enlace: () => "/super/usuarios", accion: () => "Ver pendientes",
  },
  CLINICAS_INACTIVAS: {
    Icono: IconWarning, clase: "bg-slate-100 text-slate-700",
    enlace: () => "/super/clinicas", accion: () => "Ver clínicas",
  },
};

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const nombreDelMes = (fecha) => `${MESES[Number(fecha.slice(5, 7)) - 1]} ${fecha.slice(0, 4)}`;
const fechaCorta = (iso) => new Date(iso).toLocaleDateString("es-NI", { day: "numeric", month: "short", year: "numeric" });

function Cifra({ etiqueta, valor, detalle }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-2xl border border-popim-linea bg-white px-5 py-4">
      <p className="text-[13px] font-semibold text-popim-texto">{etiqueta}</p>
      <p className="text-3xl font-extrabold text-popim-ink">{valor}</p>
      <p className="text-xs text-popim-texto">{detalle}</p>
    </div>
  );
}

export default function PanelGeneralPage() {
  const { datos: p, error, cargando } = useCarga(() => obtenerPanel(), []);

  if (cargando) return <p className="text-sm text-popim-texto">Cargando el panel…</p>;
  if (error) return <Aviso tipo="error">{error}</Aviso>;

  const maxCitas = Math.max(1, ...p.topClinicas.map((c) => c.total));

  return (
    <div className="flex flex-col gap-6">
      <EncabezadoVista
        titulo="Panel general"
        descripcion={`Toda la red de clínicas afiliadas · ${nombreDelMes(p.periodo.hasta)} (del día 1 a hoy).`}
      >
        <Boton href="/super/clinicas/nueva"><IconPlus size={16} /> Registrar clínica</Boton>
      </EncabezadoVista>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Cifra etiqueta="Clínicas activas" valor={p.cifras.clinicasActivas} detalle={`de ${p.cifras.clinicasTotal} registradas en la red`} />
        <Cifra etiqueta="Citas este mes" valor={p.cifras.citasMes} detalle={`${p.cifras.citasPendientes} aún pendientes`} />
        <Cifra etiqueta="Propietarios nuevos" valor={p.cifras.propietariosNuevos} detalle="Registrados este mes" />
        <Cifra etiqueta="Consultas atendidas" valor={p.cifras.consultasAtendidas} detalle={`Incluye ${p.cifras.emergencias} emergencias`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {/* ---------- Citas por clínica ---------- */}
        <Tarjeta
          titulo="Citas por clínica este mes"
          acciones={<Link href="/super/reportes" className="text-sm font-semibold text-popim-primary hover:underline">Ver reporte completo</Link>}
        >
          {p.topClinicas.length === 0 ? (
            <p className="text-sm text-popim-texto">Todavía no hay citas este mes.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {p.topClinicas.map((c) => (
                <li key={c.clinicaId} className="grid grid-cols-[minmax(8rem,13rem)_minmax(0,1fr)_3rem] items-center gap-3 text-sm">
                  <span className="truncate font-semibold text-popim-ink">{c.nombre}</span>
                  <span className="block h-3.5 overflow-hidden rounded-full bg-popim-page">
                    <span className="block h-full rounded-full bg-popim-primary" style={{ width: `${(c.total / maxCitas) * 100}%` }} />
                  </span>
                  <span className="text-right font-bold text-popim-ink">{c.total}</span>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>

        {/* ---------- Requiere atención ---------- */}
        <Tarjeta titulo="Requiere atención">
          {p.alertas.length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-emerald-800">
              <IconCheckCircle size={18} /> Todo en orden: no hay pendientes en la red.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-popim-linea">
              {p.alertas.map((a) => {
                const tipo = ALERTAS[a.tipo];
                const { Icono } = tipo;
                return (
                  <li key={a.tipo} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tipo.clase}`}>
                      <Icono size={17} />
                    </span>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <p className="text-sm text-popim-ink">{a.texto}</p>
                      <Link href={tipo.enlace(a)} className="text-[13px] font-semibold text-popim-primary hover:underline">
                        {tipo.accion(a)}
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Tarjeta>
      </div>

      {/* ---------- Clínicas recientes ---------- */}
      <Tarjeta
        titulo="Clínicas registradas recientemente"
        acciones={<Link href="/super/clinicas" className="text-sm font-semibold text-popim-primary hover:underline">Ver todas</Link>}
      >
        <ul className="flex flex-col divide-y divide-popim-linea">
          {p.recientes.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <Link href={`/super/clinicas/${c.id}`} className="font-semibold text-popim-ink hover:underline">{c.nombre}</Link>
                <p className="text-xs text-popim-texto">{c.direccion} · Registrada el {fechaCorta(c.fechaRegistro)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {c.sinAdministrador && (
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">Sin administrador</span>
                )}
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${c.activa ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>
                  {c.activa ? "Activa" : "Inactiva"}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </Tarjeta>
    </div>
  );
}