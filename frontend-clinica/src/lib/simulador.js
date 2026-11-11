// Capa de simulación de tu compañero (antes se llamaba lib/api.js; se renombró a simulador.js
// para no chocar con TU lib/api.js, que es la que habla con el backend).
// simular(fn) envuelve una función de lib/mockClinica.js y devuelve lo mismo que peticion():
// { ok, estado, datos } o { ok:false, estado, error }.
export class ErrorApi extends Error {
  constructor(mensaje, estado = 400) {
    super(mensaje);
    this.estado = estado;
  }
}

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// simular(fn) -> async (...args) => { ok, estado, datos } | { ok:false, estado, error }
export function simular(fn, ms = 350) {
  return async (...args) => {
    await esperar(ms);
    try {
      return { ok: true, estado: 200, datos: fn(...args) };
    } catch (e) {
      return { ok: false, estado: e.estado ?? 400, error: e.message || "Ocurrió un error. Intenta de nuevo." };
    }
  };
}
