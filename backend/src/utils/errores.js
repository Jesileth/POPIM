export class ErrorHttp extends Error {
  constructor(estado, mensaje, campo) {
    super(mensaje);
    this.estado = estado; // 400, 401, 404, 409...
    this.campo = campo;   // campo del formulario que falló
  }
}