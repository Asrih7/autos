export interface ApiBuscarTipoViaRequest {
  usuario: string;
  aplicacion: string;
  codigoCatalogo: string;
}

export interface ApiTipoVia {
  tvalor?: string;
  nvalor?: number;
  ntabla?: number;
}

export interface ApiBuscarProvinciaRequest {
  usuario: string;
  aplicacion: string;
  descripcionProvincia: string;
}

export interface ApiProvincia {
  tdescripcion?: string;
  ccodigo?: number;
  tdescripcionC?: string;
}

export interface ApiLocalidadCodigoPostalRequest {
  codigoPostal: string;
  usuario: string;
  aplicacion: string;
}

export interface ApiLocalidadCodigoPostal {
  lpobla?: string;
  lmunic?: string;
  cpobla?: string;
  codPais?: string;
  nHabitantes?: number;
  lprovi?: string;
  cpostal?: string;
}

export interface ApiNormalizarDomicilioRequest {
  tipoVia: string;
  via: string;
  numero: string;
  restoDomicilio: string;
  poblacion: string;
  municipio: string;
  codigoPostal: string;
  provincia: string;
  infCatastro: string;
  usuario: string;
  aplicacion: string;
}

export interface ApiNormalizarDomicilioResponse {
  tipoVia?: string;
  tipo_via?: string;
  via?: string;
  nombreVia?: string;
  nombre_via?: string;
  numero?: string;
  restoDomicilio?: string;
  poblacion?: string;
  municipio?: string;
  codigoPostal?: string;
  codigo_postal?: string;
  cpostal?: string;
  provincia?: string;
  provinciaDescripcion?: string;
  provincia_descripcion?: string;
  localidad?: string;
  [key: string]: any;
}
