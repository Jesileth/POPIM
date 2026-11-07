"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Aviso from "@/Componentes/ui/Aviso";
import Boton from "@/Componentes/ui/Boton";
import Campo from "@/Componentes/ui/Campo";
import EncabezadoVista from "@/Componentes/ui/EncabezadoVista";
import Tarjeta from "@/Componentes/ui/Tarjeta";
import CamposMascota, { MASCOTA_VACIA, validarMascota } from "@/Componentes/mascotas/CamposMascota";
import { formatearCedula, formatearTelefono, validarCedula, validarEmail, validarObligatorio, validarTelefono } from "@/lib/validaciones";
import { registrarPropietario } from "@/servicios/propietarios";

const PASOS = ["Propietario", "Mascota", "Revisar y guardar"];
const QUIEN = [
  { valor: "PROPIETARIO", titulo: "El propietario", texto: "Se registra con todos sus datos y recibe el código para activar su cuenta." },
  { valor: "OTRA", titulo: "Otra persona", texto: "Un menor o un acompañante. Del dueño basta nombre y teléfono." },
];

export default function RegistrarPropietarioPage() {
  const router = useRouter();
  const [paso, setPaso] = useState(1);
  const [quien, setQuien] = useState("PROPIETARIO");
  const [p, setP] = useState({ nombre: "", telefono: "", cedula: "", correo: "", direccion: "", presentador: "" });
  const [m, setM] = useState(MASCOTA_VACIA);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [guardando, setGuardando] = useState(false);
  const set = (k, f = (v) => v) => (e) => setP((x) => ({ ...x, [k]: f(e.target.value) }));
  const titular = quien === "PROPIETARIO";

  function siguiente() {
    if (paso === 1) {
      const err = {
        nombre: validarObligatorio(p.nombre, "Escribe el nombre completo."),
        telefono: validarTelefono(p.telefono),
        cedula: titular ? validarCedula(p.cedula) : p.cedula ? validarCedula(p.cedula) : "",
        correo: validarEmail(p.correo, false),
        presentador: titular ? "" : validarObligatorio(p.presentador, "Escribe quién trae a la mascota."),
      };
      setErrores(err);
      if (Object.values(err).some(Boolean)) return;
    }
    if (paso === 2) {
      const err = validarMascota(m);
      setErrores(err);
      if (Object.values(err).some(Boolean)) return;
    }
    setErrores({});
    setPaso(paso + 1);
  }

  async function guardar() {
    setGuardando(true);
    setErrorGeneral("");
    const r = await registrarPropietario({
      tipo: quien,
      propietario: { nombreCompleto: p.nombre.trim(), telefono: p.telefono, cedula: p.cedula || null, correo: p.correo.trim().toLowerCase() || null, direccion: p.direccion.trim() },
      mascota: m,
    });
    setGuardando(false);
    if (!r.ok) { setErrorGeneral(r.error); return setPaso(1); }
    router.push(`/propietarios?id=${r.datos.propietario.id}`);
  }

  const fila = (k, v) => <div className="flex justify-between gap-4 py-2 text-sm"><dt className="text-popim-muted">{k}</dt><dd className="text-right font-semibold text-popim-ink">{v || "—"}</dd></div>;

  return (
    <>
      <EncabezadoVista titulo="Registrar propietario y mascota" descripcion="Solo si la mascota no está registrada a nombre de un propietario existente." />

      <ol className="mt-5 grid gap-3 sm:grid-cols-3">
        {PASOS.map((t, i) => {
          const n = i + 1;
          return (
            <li key={t}>
              <button type="button" disabled={n >= paso} onClick={() => setPaso(n)}
                className={`flex h-14 w-full items-center gap-3 rounded-2xl border px-4 text-left text-sm font-semibold ${n === paso ? "border-popim-primary bg-white text-popim-ink" : "border-transparent bg-popim-info/70 text-popim-texto"}`}>
                <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${n <= paso ? "bg-popim-primary text-white" : "bg-popim-linea text-popim-texto"}`}>{n}</span>
                {t}
              </button>
            </li>
          );
        })}
      </ol>

      {errorGeneral && <div className="mt-4"><Aviso tipo="error">{errorGeneral}</Aviso></div>}

      <div className="mt-4 max-w-4xl">
        {paso === 1 && (
          <Tarjeta>
            <h2 className="text-lg font-bold text-popim-ink">¿Quién trae a la mascota?</h2>
            <div role="radiogroup" className="mt-3 grid gap-3 sm:grid-cols-2">
              {QUIEN.map((o) => (
                <button key={o.valor} type="button" role="radio" aria-checked={quien === o.valor} onClick={() => setQuien(o.valor)}
                  className={`rounded-xl border p-4 text-left transition ${quien === o.valor ? "border-popim-primary bg-popim-info/60" : "border-popim-linea hover:border-popim-primary/50"}`}>
                  <p className="font-bold text-popim-ink">{o.titulo}</p>
                  <p className="mt-1 text-sm text-popim-texto">{o.texto}</p>
                </button>
              ))}
            </div>

            <h2 className="mt-6 text-lg font-bold text-popim-ink">Datos del propietario</h2>
            <p className="text-sm text-popim-muted">Todos los campos con * son obligatorios.</p>
            <div className="mt-3 grid gap-4 md:grid-cols-3">
              <Campo id="nombre" etiqueta="Nombre completo" obligatorio placeholder="Ej. Ricardo Silva" value={p.nombre} onChange={set("nombre")} error={errores.nombre} />
              <Campo id="telefono" etiqueta="Teléfono" obligatorio placeholder="8888-8888" maxLength={9} value={p.telefono} onChange={set("telefono", formatearTelefono)} error={errores.telefono} />
              <Campo id="cedula" etiqueta="Cédula" obligatorio={titular} placeholder="001-010190-0000X" maxLength={16} value={p.cedula} onChange={set("cedula", formatearCedula)} error={errores.cedula} />
              <Campo id="correo" etiqueta="Correo electrónico" type="email" placeholder="correo@ejemplo.com" value={p.correo} onChange={set("correo")} error={errores.correo} />
              {!titular && <Campo id="presentador" etiqueta="Quién trae a la mascota" obligatorio placeholder="Nombre del menor o acompañante" className="md:col-span-2" value={p.presentador} onChange={set("presentador")} error={errores.presentador} />}
              <Campo id="direccion" etiqueta="Dirección" placeholder="Barrio, calle, referencia" className="md:col-span-3" value={p.direccion} onChange={set("direccion")} />
            </div>
          </Tarjeta>
        )}
        {paso === 2 && <Tarjeta titulo="Datos de la mascota"><CamposMascota datos={m} onCambio={setM} errores={errores} /></Tarjeta>}
        {paso === 3 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Tarjeta titulo="Propietario"><dl className="divide-y divide-popim-linea">
              {fila("Nombre", p.nombre)}{fila("Teléfono", p.telefono)}{fila("Cédula", p.cedula)}{fila("Correo", p.correo)}{fila("Dirección", p.direccion)}
              {!titular && fila("Lo trae", p.presentador)}
            </dl></Tarjeta>
            <Tarjeta titulo="Mascota"><dl className="divide-y divide-popim-linea">
              {fila("Nombre", m.nombre)}{fila("Sexo", m.sexo === "MACHO" ? "Macho" : "Hembra")}{fila("Edad", `${m.edad} ${m.unidadEdad === "ANIOS" ? "años" : "meses"}`)}{fila("Nacimiento", m.fechaNacimiento)}
            </dl></Tarjeta>
            <p className="text-sm text-popim-muted md:col-span-2">El sistema asignará el código único de la mascota al guardar. {titular ? "El propietario recibirá el código para activar su cuenta." : "El registro quedará sin credenciales hasta que el dueño active su cuenta."}</p>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          {paso === 1 ? <Boton variante="neutro" href="/propietarios">Cancelar</Boton> : <Boton variante="neutro" onClick={() => setPaso(paso - 1)}>← Atrás</Boton>}
          {paso < 3 ? <Boton onClick={siguiente}>Siguiente →</Boton> : <Boton onClick={guardar} disabled={guardando}>{guardando ? "Guardando..." : "Guardar propietario y mascota"}</Boton>}
        </div>
      </div>
    </>
  );
}
