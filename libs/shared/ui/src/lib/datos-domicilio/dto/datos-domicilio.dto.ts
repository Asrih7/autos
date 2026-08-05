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
  calidadCoordenadas?: string;
  codigoPobalciondd?: string;
  codigoPoblacion?: string;
  codigoPostal?: string;
  indfia?: string;
  indica?: string;
  latitud?: string;
  longitud?: string;
  numero?: string;
  municipio?: string;
  poblacion?: string;
  poblacionHombres?: string;
  poblacionMujeres?: string;
  provincia?: string;
  restoDomicilio?: string;
  seccionCensal?: string;
  tipoVia?: string;
  codigoVia?: string;
  tipo_via?: string;
  via?: string;
  nombreVia?: string;
  nombre_via?: string;
  codigo_postal?: string;
  cpostal?: string;
  provinciaDescripcion?: string;
  provincia_descripcion?: string;
  localidad?: string;
  mensajeIndicadorFiabilidad?: string;
  mensajeIndicadorCalidad?: string;
  refCatastral?: string;
  tipoInmueble?: string;
  usoInmueble?: string;
  superficieInmueble?: string;
  partInmueble?: string;
  antiguedadInmueble?: string;
  datosCatastro?: ApiDatosCatastro;
  indProvNor?: string;
  error?: number;
  [key: string]: any;
}

export interface ApiDatosCatastro {
  estadoAsigRefCat?: string;
  estCat?: string;
  errorMensaje?: string;
  refCatastral?: string;
  tipoInmueble?: string;
  usoInmueble?: string;
  antiguedadInmueble?: string;
  partInmueble?: string;
  indicadorTipoReforma?: string;
  parcelaCatastral?: string;
  numSecuencia?: string;
  anoUltimaReforma?: string;
  anoAntiguedadEfectiva?: string;
  codigoPoligono?: string;
  codigoParcela?: string;
  tipoReferenciaCatastral?: string;
  spfcieElemContructivos?: string;
  spfcieElemComunes?: string;
  spfcieTotal?: string;
  spfcieUsoVivienda?: string;
  spfcieUsoDistintoVivienda?: string;
  spfcieBi?: string;
  spfcieNoBi?: string;
  spfciePlanoParcela?: string;
  spfcieConstruidaParcela?: string;
  spfcieParcelaSobreRasante?: string;
  spfcieParcelaBajoRasante?: string;
  esViviendaUnifamiliar?: string;
  descripcionTipoInmueble?: string;
  descripcionInmueble?: string;
  descripcionTipoReforma?: string;
  descripcionViviendaUnifamiliar?: string;
}
