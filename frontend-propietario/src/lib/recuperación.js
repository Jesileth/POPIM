// Guarda el correo entre "Recuperar contraseña" y "Verifica tu identidad".
// Vive solo en la memoria del navegador: si recargas la página, se pierde
// y la pantalla te pide volver a empezar.
let correoPendiente = "";

export const guardarCorreoRecuperacion = (correo) => {
  correoPendiente = correo;
};
export const leerCorreoRecuperacion = () => correoPendiente;
export const limpiarCorreoRecuperacion = () => {
  correoPendiente = "";
};