import { 
  ApiVehiculoResponse, 
  ApiMarcaResponse, 
  ApiModeloResponse, 
  ApiCarroceriaResponse, 
  ApiAccesorioResponse 
} from "../dtos/vehiculo.dto";
import { 
  Vehiculo, 
  Marca, 
  Modelo, 
  VersionVehiculo, 
  CarroceriaOption, 
  AccesoriosAdicionales 
} from "../models/vehiculo.models";

export function mapToVehiculoDomain(dto: ApiVehiculoResponse): Vehiculo {
  if (!dto?.versiones || dto.versiones.length === 0) {
    throw new Error("vehiculo.errors.noEncontrado");
  }
  const primaryNode = dto.versiones[0];

  return {
    codigoActividad: dto.codigoActividad || "2000",
    clasificacion: {
      categoriaVehiculo: primaryNode.clasificacion?.categoriaVehiculo || "",
      tipoVehiculo: primaryNode.clasificacion?.tipoVehiculo,
      claseVehiculo: primaryNode.clasificacion?.claseVehiculo || "",
    },
    marca: {
      id: primaryNode.marca?.id || "",
      nombre: primaryNode.marca?.nombre || "",
      logo: resolveSafeLogoPath(primaryNode.marca?.id)
    },
    modelo: {
      id: primaryNode.modelo?.id || "",
      nombre: primaryNode.modelo?.nombre || ""
    },
    version: {
      id: primaryNode.version?.id || "",
      nombre: primaryNode.version?.nombre || "",
      combustible: primaryNode.motorizacion?.combustible || "",
      cilindrada: primaryNode.motorizacion?.cilindradaCc || "",
      potencia: primaryNode.motorizacion?.potenciaCv || "",
      puertas: primaryNode.caracteristicas?.numeroPuertas || "",
      inicioFabricacion: primaryNode.comercial.anioLanzamiento.toString(),
      tipoVehiculo: primaryNode.clasificacion?.tipoVehiculo || "",
    },
    tieneAccesoriosSeries: false,
    restoCampos: {
      tieneRemolque: false,
      tipoCarroceria: "", 
      fechaPrimeraMatriculacion: "",
      codigoPostalRegistro: "",
      provinciaRegistro: ""
    },
    accesoriosAdicionales: []
  };
}


export function mapToMarcasDomain(dtoList: ApiMarcaResponse[]): Marca[] {
  if (!dtoList) return [];
  return dtoList.map(dto => {
    return {
      id: dto.codigo,
      nombre: dto.descripcion,
      logo: resolveSafeLogoPath(dto.codigo)
    };
  });
}

export function mapToModelosDomain(dtoList: ApiModeloResponse[]): Modelo[] {
  if (!dtoList) return [];
  return dtoList.map(dto => ({
    id: dto.codigo,
    nombre: dto.descripcion
  }));
}

export function mapToVersionesCatalogDomain(dto: ApiVehiculoResponse): VersionVehiculo[] {
  if (!dto?.versiones) return [];
  return dto.versiones.map(node => ({
    id: node.version?.id || "",
    nombre: node.version?.nombre || "",
    combustible: node.motorizacion?.combustible || "",
    cilindrada: node.motorizacion?.cilindradaCc || "",
    potencia: node.motorizacion?.potenciaCv || "",
    puertas: node.caracteristicas?.numeroPuertas || "",
    inicioFabricacion: node.comercial.anioLanzamiento.toString(),
    tipoVehiculo: node.clasificacion.tipoVehiculo
  }));
}

export function mapToCarroceriasDomain(dtoList: ApiCarroceriaResponse[]): CarroceriaOption[] {
  if (!dtoList) return [];
  return dtoList.map(dto => ({
    codigo: dto.codigo,
    descripcion: dto.descripcion
  }));
}

export function mapToAccesoriosDomain(dtoList: ApiAccesorioResponse[]): AccesoriosAdicionales[] {
  if (!dtoList) return [];
  return dtoList.map(dto => ({
    checked: false,
    idAccesorio: dto.idAccesorio,
    idModeloVehiculo: dto.idModeloVehiculo,
    codigoAccesorio: dto.codigoAccesorio,
    anyoAccesorio: dto.anyoAccesorio,
    mesAccesorio: dto.mesAccesorio,
    importeAccesorio: dto.importeAccesorio,
    descripcionAccesorio: dto.descripcionAccesorio,
    tipoAccesorio: dto.tipoAccesorio
  }));
}

const AVAILABLE_BRAND_LOGOS: Array<{ codigo: string; descripcion: string }> = [
  { codigo: '25', descripcion: 'audi' },
  { codigo: '30', descripcion: 'bmw' },
  { codigo: '33', descripcion: 'citroen' },
  { codigo: '121', descripcion: 'daf' },
  { codigo: '38', descripcion: 'fiat' },
  { codigo: '39', descripcion: 'ford' },
  { codigo: '42', descripcion: 'honda' },
  { codigo: '15', descripcion: 'hyundai' },
  { codigo: '309', descripcion: 'iveco' },
  { codigo: '266', descripcion: 'john deere' },
  { codigo: '4', descripcion: 'kawasaki' },
  { codigo: '7', descripcion: 'kia' },
  { codigo: '210', descripcion: 'ktm' },
  { codigo: '311', descripcion: 'man' },
  { codigo: '56', descripcion: 'mercedes' },
  { codigo: '271', descripcion: 'new holland' },
  { codigo: '13', descripcion: 'nissan' },
  { codigo: '59', descripcion: 'opel' },
  { codigo: '60', descripcion: 'peugeot' },
  { codigo: '230', descripcion: 'piaggio' },
  { codigo: '16', descripcion: 'renault' },
  { codigo: '68', descripcion: 'seat' },
  { codigo: '1740', descripcion: 'segway' },
  { codigo: '70', descripcion: 'skoda' },
  { codigo: '73', descripcion: 'suzuki' },
  { codigo: '14', descripcion: 'toyota' },
  { codigo: '8', descripcion: 'volkswagen' },
  { codigo: '77', descripcion: 'volvo' },
  { codigo: '246', descripcion: 'yamaha' },
];

const LOGO_CODES_ON_DISK = new Set<string>(AVAILABLE_BRAND_LOGOS.map(item => item.codigo));

function resolveSafeLogoPath(codigo: string | null | undefined): string {
  const cleanCode = (codigo || '').trim();
  
  if (LOGO_CODES_ON_DISK.has(cleanCode)) {
    return `assets/images/marcas/${cleanCode}.png`;
  }
  
  return 'assets/images/marcas/noexiste.png';
}