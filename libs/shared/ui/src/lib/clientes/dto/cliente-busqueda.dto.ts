export interface ApiClienteDatosPersonalesRequest {
  readonly documento: string;
  readonly codCiaDgs: string;
  readonly nombre: string;
  readonly apellido1: string;
  readonly apellido2: string;
  readonly razonSocial: string;
  readonly telefono: string;
  readonly email: string;
  readonly mediador: string;
  readonly puntoVenta: string;
  readonly csb: string;
  readonly oficina: string;
  readonly usuario: string;
  readonly aplicacion: string;
  readonly consultarProspect: string;
  readonly idioma: string;
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
