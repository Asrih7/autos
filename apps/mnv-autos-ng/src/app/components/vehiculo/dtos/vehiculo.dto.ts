export interface ApiVehiculoResponse {
  versionMasContratada: number;
  codigoActividad: string;
  versiones: ApiVehiculoVersionNode[];
}

export interface ApiVehiculoVersionNode {
  version: {
    id: string;
    nombre: string;
  };
  clasificacion: {
    categoriaVehiculo: string;
    tipoVehiculo: string;
    claseVehiculo: string;
  };
  marca: {
    id: string;
    nombre: string;
  };
  modelo: {
    id: string;
    nombre: string;
  };
  caracteristicas: {
    numeroPuertas: string;
    numeroPlazas: string;
    medidaNeumaticos: string;
  };
  motorizacion: {
    combustible: string;
    cilindradaCc: string;
    potenciaCv: string;
    potenciaKw: string;
    velocidadMaxima: string;
  };
  comercial: {
    precioOficial: string;
    precioVentaPublico: string;
    anioLanzamiento: number;
  };
  origen: string;
}

export interface ApiMarcaResponse {
  codigo: string;
  descripcion: string;
  orden: number;
}

export interface ApiModeloResponse {
  codigo: string;
  descripcion: string;
}

export interface ApiCarroceriaResponse {
  codigo: string;
  descripcion: string;
}

export interface ApiAccesorioResponse {
  idAccesorio: number;
  idModeloVehiculo: number;
  codigoAccesorio: string;
  anyoAccesorio: string;
  mesAccesorio: number;
  importeAccesorio: number;
  descripcionAccesorio: string;
  tipoAccesorio: string;
}
