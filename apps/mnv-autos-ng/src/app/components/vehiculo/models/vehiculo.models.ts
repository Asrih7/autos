export interface Vehiculo {
  marca: Marca;
  modelo: Modelo;
  version: Version;
  tieneAccesoriosSeries: boolean;
  restoCampos: RestoCamposModel;
  accesoriosAdicionales: AccesoriosAdicionales[];
}

export interface AccesoriosAdicionales {
  // Local state tracking property
  checked: boolean;
  idAccesorio: number;
  idModeloVehiculo: number;
  codigoAccesorio: string;
  anyoAccesorio: string;
  mesAccesorio: number;
  importeAccesorio: number;
  descripcionAccesorio: string;
  tipoAccesorio: string;
}

export interface Modelo {
  id: string;
  nombre: string;
}
export interface Marca {
  id: string;
  nombre: string;
  logo: string;
}
export interface Version {
  id: string;
  nombre: string;
  combustible: string;
  cilindrada: string;
  potencia: string;
  puertas: string;
  inicioFabricacion: string;
    // "idVersion": "string", OK
  // "version": "string",
  // "cilindradaCc": "string", OK
  // "potenciaCv": "string", OK
  // "numeroPuertas": "string", OK
}
export type BrandModelSummary = Pick<Vehiculo, "marca" | "modelo">;

export interface RestoCamposModel {
  tieneRemolque: boolean;
  tipoCarroceria: string;
  fechaPrimeraMatriculacion: string;
  codigoPostalRegistro: string;
  provinciaRegistro: string;
}

export interface CarroceriaOption {
  codigo: string;
  descripcion: string;
}

export interface GroupedAccesorios {
  nombreGrupo: string;
  items: AccesoriosAdicionales[];
}

export type MetodoBusqueda = 'matricula' | 'bastidor';
