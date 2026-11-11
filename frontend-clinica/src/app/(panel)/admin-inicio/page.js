"use client";
import Link from "next/link";
import { TituloAdmin, TarjetaAdmin, Estado } from "@/Componentes/administrador/AdminUI";

const kpis = [
 ["Citas de hoy","18","6 solicitadas esperan confirmación"],
 ["En consulta ahora","2","Estado En curso"],
 ["Personal activo","9","4 veterinarios · 4 recepcionistas · 1 administrador"],
 ["Cuentas bloqueadas","1","Solo tú puedes desbloquearlas"],
];
const vets = [
 {n:"Dra. Ana Morales",i:"AM",c:6,a:34,b:17,d:34,e:15},
 {n:"Dr. José Rivera",i:"JR",c:4,a:25,b:25,d:25,e:25},
 {n:"Dra. Karla Díaz",i:"KD",c:3,a:0,b:0,d:33,e:67},
 {n:"Dr. Luis Herrera",i:"LH",c:5,a:20,b:0,d:40,e:40},
];
export default function InicioAdministrador(){
 return <div className="mx-auto max-w-[1400px]">
  <TituloAdmin titulo="Inicio" descripcion="Resumen de tu clínica para hoy. Los números se calculan a partir de las citas, el personal y los bloqueos registrados." />
  <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{kpis.map(([t,n,d],i)=><TarjetaAdmin key={t}><p className="text-sm font-semibold text-popim-texto">{t}</p><p className="mt-1 text-3xl font-extrabold text-popim-ink">{n}</p><p className="mt-1 text-xs text-popim-muted">{d}</p>{i===3&&<div className="mt-2"><Estado tipo="pendiente">Requiere atención</Estado></div>}</TarjetaAdmin>)}</div>
  <div className="grid gap-4 xl:grid-cols-[1.35fr_.8fr]">
   <TarjetaAdmin titulo="Citas de hoy por veterinario"><p className="-mt-3 mb-4 text-xs text-popim-muted">Cuántas citas tiene cada uno y en qué estado van.</p><div className="mb-4 flex flex-wrap gap-3 text-xs text-popim-muted"><span>🟩 Finalizada</span><span>🟦 En curso</span><span>🟪 Confirmada</span><span>🟧 Solicitada</span></div><div className="space-y-4">{vets.map(v=><div key={v.i} className="grid grid-cols-[32px_minmax(110px,1fr)_minmax(120px,2fr)_50px] items-center gap-2 text-sm"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-popim-panel-oscuro text-xs font-bold text-white">{v.i}</span><span className="truncate font-medium text-popim-ink">{v.n}</span><div className="flex h-3 overflow-hidden rounded-full bg-slate-100"><span className="bg-green-700" style={{width:`${v.a}%`}}/><span className="bg-teal-600" style={{width:`${v.b}%`}}/><span className="bg-blue-600" style={{width:`${v.d}%`}}/><span className="bg-amber-500" style={{width:`${v.e}%`}}/></div><b className="text-right text-popim-ink">{v.c} citas</b></div>)}</div></TarjetaAdmin>
   <TarjetaAdmin titulo="Requiere tu atención"><div className="space-y-4 divide-y divide-popim-linea"><div className="pb-3"><p className="text-sm text-popim-texto">🔒 La cuenta de Dra. Karla Díaz se bloqueó tras 5 intentos fallidos.</p><Link className="mt-1 inline-block text-sm font-semibold text-popim-primary underline" href="/admin-personal">Desbloquear cuenta</Link></div><div className="py-3"><p className="text-sm text-popim-texto">⚠️ El bloqueo «Permiso personal» de Dr. Luis Herrera choca con 1 cita confirmada (16:00).</p><Link className="mt-1 inline-block text-sm font-semibold text-popim-primary underline" href="/admin-horarios">Ver bloqueo</Link></div><div className="py-3"><p className="text-sm text-popim-texto">✉️ Elena Pérez (recepcionista) aún no activa su cuenta.</p><Link className="mt-1 inline-block text-sm font-semibold text-popim-primary underline" href="/admin-personal">Ver persona</Link></div><div className="pt-3"><p className="text-sm text-popim-texto">◷ Dr. José Rivera no tiene horario asignado el sábado.</p><Link className="mt-1 inline-block text-sm font-semibold text-popim-primary underline" href="/admin-horarios">Asignar horario</Link></div></div></TarjetaAdmin>
  </div>
  <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_1fr]"><TarjetaAdmin titulo="Este mes"><p className="-mt-3 mb-4 text-xs text-popim-muted">Noviembre 2026, del día 1 a hoy.</p><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[["214","Citas atendidas"],["11","Emergencias"],["17","Cancelaciones"],["29","Propietarios nuevos en la clínica"]].map(([n,t])=><div key={t} className="rounded-xl bg-popim-page p-3"><p className="text-2xl font-extrabold text-popim-ink">{n}</p><p className="text-xs text-popim-muted">{t}</p></div>)}</div></TarjetaAdmin><TarjetaAdmin titulo="Próximos bloqueos de agenda"><div className="divide-y divide-popim-linea text-sm"><div className="flex justify-between gap-3 py-2"><span><b className="text-popim-ink">Dr. Luis Herrera</b><br/><span className="text-popim-muted">Permiso personal</span></span><span className="text-right text-popim-muted">Hoy · 16:00 – 17:00</span></div><div className="flex justify-between gap-3 py-3"><span><b className="text-popim-ink">Dra. Karla Díaz</b><br/><span className="text-popim-muted">Cirugía programada</span></span><span className="text-right text-popim-muted">Jue 5 nov · 11:00 – 13:00</span></div><div className="flex justify-between gap-3 py-3"><span><b className="text-popim-ink">Dra. Ana Morales</b><br/><span className="text-popim-muted">Vacaciones</span></span><span className="text-right text-popim-muted">23 – 27 nov</span></div></div><Link href="/admin-horarios" className="mt-2 inline-block text-sm font-semibold text-popim-primary underline">Gestionar</Link></TarjetaAdmin></div>
 </div>;
}
