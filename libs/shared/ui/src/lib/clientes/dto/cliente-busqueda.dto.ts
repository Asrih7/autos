export interface ApiClienteDatosPersonalesRequest {
  readonly documento: string;
  readonly usuario: string;
  readonly aplicacion: string;
  readonly consultarProspect?: string;
  readonly idioma?: string;
}

export interface ApiCliente {
  readonly clienId?: number;
  readonly documento?: string;
  readonly tipoPersona?: string;
  readonly nombre?: string;
  readonly apell1?: string;
  readonly apell2?: string;
  readonly razonSocial?: string;
  readonly fecNac?: string;
  readonly indSexo?: string;
}

export interface ApiDatosBusquedaCliente {
  readonly clientes?: readonly ApiCliente[];
  readonly prospectoClientes?: readonly ApiCliente[];
}

export interface ApiNormalizarDocumentoRequest {
  readonly tipoDocumento: string;
  readonly letra: string;
  readonly numero: string;
  readonly usuario: string;
  readonly aplicacion: string;
}

export interface ApiNormalizarDocumentoResponse {
  readonly numeroNormalizado?: string;
  readonly letraNormalizado?: string;
  readonly codigoError?: number;
  readonly desError?: string;
  readonly tipoDocumento?: string;
}

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
