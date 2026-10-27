/* !! Estas son las respuestas falsas, esto se borra cuando el backend este listo */
/* !! lee esto joaquin*/
import { simularPortal } from "@/lib/mockPortal";

const esperar = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

// agregamos las cosas que van en las tablas 
const ESPECIES_MOCK = [
  { id: 1, nombre: "Canino" },
  { id: 2, nombre: "Felino" },
  { id: 3, nombre: "Ave" },
  { id: 4, nombre: "Roedor" },
  { id: 5, nombre: "Reptil" },
  { id: 6, nombre: "Equino" },
  { id: 7, nombre: "Bovino" },
  { id: 8, nombre: "Porcinos" },
  { id: 9, nombre: "Ovino" },
  { id: 10, nombre: "Caprino" },
  { id: 11, nombre: "Anfibios" },
  { id: 12, nombre: "Otro" }
];

const RAZAS_MOCK = {
  1: [
    "Mestizo",
    "Labrador Retriever",
    "Pastor Alemán",
    "Golden Retriever",
    "Bulldog Francés",
    "Beagle",
    "Poodle / Caniche",
    "Rottweiler",
    "Yorkshire Terrier",
    "Boxer",
    "Chihuahua",
    "Dachshund / Teckel",
    "Siberian Husky",
    "Pug",
    "Shih Tzu",
    "Border Collie",
    "Doberman"
  ],
  2: [
    "Mestizo",
    "Persa",
    "Maine Coon",
    "Siamés",
    "Ragdoll",
    "Sphynx / Esfinge",
    "Bengalí",
    "British Shorthair",
    "Azul Ruso",
    "Angora",
    "Siberiano"
  ],
  3: [
    "Mestizo",
    "Perico Australiano",
    "Ninfa / Ninfa Carolina",
    "Agapornis / Inseparable",
    "Canario",
    "Cacatúa",
    "Loro Amazonas",
    "Guacamayo"
  ],
  4: [
    "Mestizo",
    "Hámster Sirio",
    "Hámster Enano Ruso",
    "Cobaya / Cuyo (Peruviana)",
    "Cobaya / Cuyo (Abisinia)",
    "Cobaya / Cuyo (Americana)",
    "Rata Doméstica (Fancy)",
    "Gerbo",
    "Chinchilla"
  ],
  5: [
    "Mestizo",
    "Iguana Verde",
    "Dragón Barbudo",
    "Geco Leopardo",
    "Tortuga de Orejas Rojas",
    "Tortuga Rusa",
    "Pitón Bola",
    "Serpiente del Maíz"
  ],
  6: [
    "Mestizo",
    "Pura Sangre Inglés",
    "Cuarto de Milla",
    "Paso Fino",
    "Árabe",
    "Andaluz / Pura Raza Española",
    "Percherón",
    "Appaloosa",
    "Pinto"
  ],
  7: [
    "Mestizo",
    "Holstein",
    "Angus",
    "Brahman",
    "Simmental",
    "Gyr",
    "Jersey",
    "Charolais",
    "Hereford"
  ],
  8: [
    "Mestizo",
    "Yorkshire / Large White",
    "Duroc",
    "Landrace",
    "Hampshire",
    "Pietrain",
    "Cerdo Minipig"
  ],
  9: [
    "Mestizo",
    "Dorper",
    "Katahdin",
    "Pelibuey",
    "Suffolk",
    "Merino",
    "Rambouillet"
  ],
  10: [
    "Mestizo",
    "Saanen",
    "Boer",
    "Anglo-Nubiana",
    "Alpine",
    "Toggenburg",
    "Cabra Enana Pigmea"
  ],
  11: [
    "Mestizo",
    "Ajolote (Ambystoma mexicanum)",
    "Rana Pacman",
    "Rana dardo dorada",
    "Rana de ojos rojos",
    "Sapo de vientre de fuego"
  ],
  12: [] // sin raza
};


export async function simular(ruta, metodo, cuerpo) {
  await esperar(700); // simula el tiempo de respuesta del servidor, solo es un load falso jaja

  const respuestaPortal = simularPortal(ruta, metodo, cuerpo);
  if (respuestaPortal) return respuestaPortal;

    if (ruta === "/catalogos/especies") {
    return { ok: true, estado: 200, datos: { especies: ESPECIES_MOCK } };
  }

  const coincidencia = ruta.match(/^\/catalogos\/especies\/(\d+)\/razas$/);
  if (coincidencia) {
    const especieId = Number(coincidencia[1]);
    const nombres = RAZAS_MOCK[especieId] ?? [];
    return {
      ok: true,
      estado: 200,
      datos: {
        razas: nombres.map((nombre, indice) => ({ id: especieId * 100 + indice + 1, nombre })),
      },
    };
  }
  
  switch (ruta) {
    case "/auth/login":

      if (cuerpo.identificador === "error@popim.com") {
        return { ok: false, estado: 401, error: "Correo o contraseña incorrectos." };
      }
      return { ok: true, estado: 200, datos: { usuario: { id: "1", nombre: "Propietario de prueba", rol: "propietario" } } };


     case "/auth/registro":
      if (cuerpo.email === "repetido@popim.com") {
        return { ok: false, estado: 409, campo: "email", error: "Este correo ya está registrado." };
      }
      if (cuerpo.telefono === "88888888") {
        return { ok: false, estado: 409, campo: "telefono", error: "Este teléfono ya está registrado." };
      }
      if (cuerpo.cedula === "0010101900001A") {
        return { ok: false, estado: 409, campo: "cedula", error: "Esta cédula ya está registrada." };
      }
      return { ok: true, estado: 201, datos: {} };

    case "/auth/activacion/buscar":
      if (cuerpo.identificador === "noexiste") {
        return { ok: false, estado: 404, error: "No encontramos un perfil pendiente de activación con esos datos." };
      }
      return { ok: true, estado: 200, datos: { tokenActivacion: "token-de-prueba" } };

    case "/auth/activacion/confirmar":
      return { ok: true, estado: 200, datos: {} };

    case "/auth/recuperacion/solicitar":
      return { ok: true, estado: 200, datos: {} };

    case "/auth/recuperacion/confirmar":
      if (cuerpo.codigo !== "123456") {
        return { ok: false, estado: 400, error: "El código es incorrecto o ya expiró." };
      }
      return { ok: true, estado: 200, datos: {} };

    case "/mascotas":
      return { ok: true, estado: 201, datos: {} };

    default:
      return { ok: false, estado: 404, error: "Ruta no encontrada." };

    case "/auth/recuperacion/verificar":
      if (cuerpo.codigo !== "123456") {
        return { ok: false, estado: 400, error: "El código es incorrecto o ya expiró." };
      }
      return { ok: true, estado: 200, datos: { tokenRestablecimiento: "token-de-prueba" } };

    case "/auth/recuperacion/restablecer":
      return { ok: true, estado: 200, datos: {} };
  }
}


