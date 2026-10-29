import { peticion } from "@/lib/api";
import { ESPECIES_MOCK, RAZAS_MOCK } from "@/lib/mock";
import { MASCOTAS } from "@/lib/mockPortal";

const MOCK_STORAGE_KEY = "popim_mascotas_mock";

// Helper para obtener las mascotas del localStorage o inicializar con las de prueba
function obtenerMascotasSimuladas() {
  if (typeof window === "undefined") return MASCOTAS;
  try {
    const guardadas = localStorage.getItem(MOCK_STORAGE_KEY);
    if (!guardadas) {
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(MASCOTAS));
      return MASCOTAS;
    }
    return JSON.parse(guardadas);
  } catch (e) {
    return MASCOTAS;
  }
}

// Convertir foto File/Blob a Base64
function convertirArchivoABase64(archivo) {
  return new Promise((resolve) => {
    if (!archivo || !(archivo instanceof File)) {
      resolve(null);
      return;
    }
    const lector = new FileReader();
    lector.onloadend = () => resolve(lector.result);
    lector.onerror = () => resolve(null);
    lector.readAsDataURL(archivo);
  });
}

// 1. Listar Mascotas
export const listarMascotas = async () => {
  try {
    const respuesta = await peticion("/mascotas");
    if (respuesta && respuesta.ok) return respuesta;
  } catch (e) {
    // Si falla la API backend, cae al mock sin romper la ejecución
  }

  const mascotas = obtenerMascotasSimuladas();
  return { ok: true, datos: { mascotas } };
};

// 2. Registrar Mascota (Garantizado en LocalStorage)
export const registrarMascota = async (cuerpo) => {
  // Intentar backend primero
  try {
    const respuesta = await peticion("/mascotas", { metodo: "POST", cuerpo });
    if (respuesta && respuesta.ok) return respuesta;
  } catch (e) {
    // Si falla la petición HTTP, continúa a la simulación local
  }

  // SIMULACIÓN LOCALSTORAGE
  try {
    const listaActual = obtenerMascotasSimuladas();

    // 1. Convertir la foto
    let fotoUrlFinal = null;
    if (cuerpo.foto) {
      fotoUrlFinal = await convertirArchivoABase64(cuerpo.foto);
    }

    // 2. Especie
    const especieIdNum = Number(cuerpo.especieId);
    const especieObj = ESPECIES_MOCK.find((e) => Number(e.id) === especieIdNum);
    const especieNombre = especieObj ? especieObj.nombre : "Canino";

    // 3. Raza
    const esOtro = especieIdNum === 12;
    let razaNombre = "Mestizo";

    if (cuerpo.razaId && !esOtro) {
      const razasEspecie = RAZAS_MOCK[especieIdNum] || [];
      // Si la raza viene como ID o como String
      const encontrada = razasEspecie.find(
        (r) => String(r.id || r) === String(cuerpo.razaId)
      );

      if (encontrada) {
        razaNombre = typeof encontrada === "object" ? encontrada.nombre : encontrada;
      } else if (typeof cuerpo.razaId === "string") {
        razaNombre = cuerpo.razaId;
      }
    }

    // 4. Edad en meses
    let edadMeses = Number(cuerpo.edad) || 1;
    if (cuerpo.unidadEdad === "anios" || cuerpo.unidadEdad === "ANIOS") {
      edadMeses = Number(cuerpo.edad) * 12;
    }

    // 5. Crear objeto con la estructura exacta que leen TarjetaMascota y FichaMascota
    const nuevaMascota = {
      id: `m_${Date.now()}`,
      codigoUnico: `PET-${Math.floor(1000 + Math.random() * 9000)}-KX`,
      nombre: cuerpo.nombre,
      especie: {
        id: especieIdNum,
        nombre: especieNombre,
      },
      raza: esOtro ? null : { id: Date.now(), nombre: razaNombre },
      sexo: cuerpo.sexo,
      edadActualMeses: edadMeses,
      fechaNacimiento: cuerpo.fechaNacimiento || null,
      fotoUrl: fotoUrlFinal,
    };

    // 6. Guardar en localStorage
    const nuevaLista = [nuevaMascota, ...listaActual];
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(nuevaLista));

    return { ok: true, datos: { mascota: nuevaMascota } };
  } catch (err) {
    console.error("Error guardando en LocalStorage:", err);
    return { ok: false, error: "No se pudo guardar la mascota localmente." };
  }
};

// Exportaciones obligatorias para las demás pantallas
export const obtenerMascota = (id) => peticion(`/mascotas/${id}`);
export const obtenerCartilla = (id) => peticion(`/mascotas/${id}/cartilla`);
export const listarConsultasMascota = (id) => peticion(`/mascotas/${id}/consultas`);
export const listarExamenesMascota = (id) => peticion(`/mascotas/${id}/examenes`);
//#region 
// 
/*
 Regsitro de mascota 

import { peticion } from "@/lib/api";

export const registrarMascota = (cuerpo) =>
  peticion("/mascotas", { metodo: "POST", cuerpo });

export const listarMascotas = () => peticion("/mascotas");


export const obtenerMascota = (id) => peticion(`/mascotas/${id}`);
export const obtenerCartilla = (id) => peticion(`/mascotas/${id}/cartilla`);
export const listarConsultasMascota = (id) => peticion(`/mascotas/${id}/consultas`);
export const listarExamenesMascota = (id) => peticion(`/mascotas/${id}/examenes`);

*/
//#endregion
