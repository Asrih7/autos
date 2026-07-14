export interface Vehiculo {
  marca: Marca;
  modelo: Modelo;
  version: Version;
  remolque: boolean;
  carroceria: string;
  codigoPostal: number;
  provincia?: string;
  tieneAccesoriosSeries: boolean;
  accesoriosAdicionales: AccesoriosAdicionales[];
}

export interface AccesoriosAdicionales {
  id: number | string;
  checked: boolean;
  descripcion: string;
  precio: number;
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
}

export type BrandModelSummary = Pick<Vehiculo, 'marca' | 'modelo'>;