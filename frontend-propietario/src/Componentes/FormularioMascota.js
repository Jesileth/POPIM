"use client";

import { useState } from "react";
import CampoTexto from "@/Componentes/CampoTexto";
import CampoSelect from "@/Componentes/CampoSelect";
import BotonPrimario from "@/Componentes/BotonPrimario";
import { ESPECIES_MOCK, RAZAS_MOCK } from "@/lib/mock";

export default function FormularioMascota({ onGuardar, onCancelar }) {
  const [formData, setFormData] = useState({
    nombre: "",
    especieId: "1", // Canino por defecto
    razaNombre: "Mestizo", // Primera opción por defecto
    sexo: "HEMBRA",
    fechaNacimiento: "",
    edadTexto: "",
  });

  // Maneja el cambio de especie y ajusta las razas dinámicamente
  const handleEspecieChange = (e) => {
    const nuevaEspecieId = e.target.value;
    const razasDisponibles = RAZAS_MOCK[nuevaEspecieId] || [];

    setFormData((prev) => ({
      ...prev,
      especieId: nuevaEspecieId,
      // Si la especie es "Otro" (12), no hay razas. Si tiene razas, asigna "Mestizo" por defecto
      razaNombre: razasDisponibles.length > 0 ? razasDisponibles[0] : "",
    }));
  };

  // Calcula la edad aproximada en texto según la fecha ingresada
  const handleFechaChange = (e) => {
    const fecha = e.target.value;
    let edadCalculada = "";

    if (fecha) {
      const nac = new Date(fecha);
      const hoy = new Date();
      let meses = (hoy.getFullYear() - nac.getFullYear()) * 12 + (hoy.getMonth() - nac.getMonth());

      if (meses < 1) {
        edadCalculada = "Menos de 1 mes";
      } else if (meses < 12) {
        edadCalculada = `${meses} ${meses === 1 ? "mes" : "meses"}`;
      } else {
        const anos = Math.floor(meses / 12);
        const mesesRestantes = meses % 12;
        edadCalculada = `${anos} ${anos === 1 ? "año" : "años"}` + (mesesRestantes > 0 ? ` y ${mesesRestantes} mes${mesesRestantes > 1 ? "es" : ""}` : "");
      }
    }

    setFormData((prev) => ({
      ...prev,
      fechaNacimiento: fecha,
      edadTexto: edadCalculada,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const especieSeleccionada = ESPECIES_MOCK.find((e) => String(e.id) === String(formData.especieId));

    const nuevaMascota = {
      nombre: formData.nombre.trim(),
      especie: {
        id: Number(formData.especieId),
        nombre: especieSeleccionada?.nombre ?? "Otro",
      },
      raza: formData.razaNombre ? { nombre: formData.razaNombre } : null,
      sexo: formData.sexo,
      fechaNacimiento: formData.fechaNacimiento || null,
    };

    onGuardar(nuevaMascota);
  };

  const esOtro = String(formData.especieId) === "12";
  const razasDisponibles = RAZAS_MOCK[formData.especieId] || [];

  return (
    <div className="rounded-2xl border border-popim-linea bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-6 flex items-center justify-between border-b border-popim-linea pb-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-popim-etiqueta">
          Datos Básicos de la Mascota
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Nombre */}
          <CampoTexto
            label="Nombre"
            placeholder="Ej. Luna"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            required
          />

          {/* Especie */}
          <CampoSelect
            label="Especie"
            value={formData.especieId}
            onChange={handleEspecieChange}
            required
          >
            {ESPECIES_MOCK.map((esp) => (
              <option key={esp.id} value={esp.id}>
                {esp.nombre}
              </option>
            ))}
          </CampoSelect>

          {/* Raza */}
          <CampoSelect
            label="Raza"
            value={formData.razaNombre}
            onChange={(e) => setFormData({ ...formData, razaNombre: e.target.value })}
            disabled={esOtro || razasDisponibles.length === 0}
            required={!esOtro}
          >
            {esOtro || razasDisponibles.length === 0 ? (
              <option value="">No aplica para esta especie</option>
            ) : (
              razasDisponibles.map((raza) => (
                <option key={raza} value={raza}>
                  {raza}
                </option>
              ))
            )}
          </CampoSelect>

          {/* Sexo */}
          <CampoSelect
            label="Sexo"
            value={formData.sexo}
            onChange={(e) => setFormData({ ...formData, sexo: e.target.value })}
            required
          >
            <option value="HEMBRA">Hembra</option>
            <option value="MACHO">Macho</option>
          </CampoSelect>

          {/* Edad (Calculada automáticamente) */}
          <CampoTexto
            label="Edad calculada"
            placeholder="Ej. 3 meses"
            value={formData.edadTexto}
            readOnly
            disabled
          />

          {/* Fecha de nacimiento */}
          <CampoTexto
            type="date"
            label="Fecha de nacimiento"
            value={formData.fechaNacimiento}
            onChange={handleFechaChange}
          />
        </div>

        <p className="text-xs text-popim-muted">
          El sistema asignará un Código Único de mascota automáticamente al guardar.
        </p>

        {/* Botones de acción */}
        <div className="flex items-center gap-3 pt-2">
          <BotonPrimario type="submit">Guardar mascota</BotonPrimario>
          <button
            type="button"
            onClick={onCancelar}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-popim-linea bg-white px-6 text-sm font-semibold text-popim-ink transition hover:bg-popim-page"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}