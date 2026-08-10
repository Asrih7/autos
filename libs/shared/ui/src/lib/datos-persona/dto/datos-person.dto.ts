export interface ApiNormalizarNombreRequest {
  readonly nombre: string;
  readonly apellido1: string;
  readonly apellido2: string;
  readonly sexo: string;
  readonly usuario: string;
  readonly aplicacion: string;
}

export interface ApiNormalizarNombreResponse {
  readonly nombre?: string;
  readonly apellido1?: string;
  readonly apellido2?: string;
  readonly error?: number;
}
