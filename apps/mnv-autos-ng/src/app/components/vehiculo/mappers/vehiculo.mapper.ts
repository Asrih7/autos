import { ApiVehiculoResponse, ApiMarcaResponse, ApiModeloResponse, ApiCarroceriaResponse, ApiAccesorioResponse } from "../dtos/vehiculo.dto";
import { Vehiculo, Marca, Modelo, VersionVehiculo, CarroceriaOption, AccesoriosAdicionales } from "../models/vehiculo.models";


export function mapToVehiculoDomain(dto: ApiVehiculoResponse): Vehiculo {
  if (!dto?.versiones || dto.versiones.length === 0) {
    throw new Error("vehiculo.errors.noEncontrado");
  }

  const primaryNode = dto.versiones[0];

  return {
    codigoActividad: dto.codigoActividad,
    clasificacion: {
      categoriaVehiculo: primaryNode.clasificacion.categoriaVehiculo,
      tipoVehiculo: primaryNode.clasificacion.tipoVehiculo,
      claseVehiculo: primaryNode.clasificacion.claseVehiculo,
    },
    marca: {
      id: primaryNode.marca.id,
      nombre: primaryNode.marca.nombre,
      // logo: `assets/logos/${primaryNode.marca.id.toLowerCase()}.png`
    },
    modelo: {
      id: primaryNode.modelo.id,
      nombre: primaryNode.modelo.nombre
    },
    version: {
      id: primaryNode.version.id,
      nombre: primaryNode.version.nombre,
      combustible: primaryNode.motorizacion.combustible,
      cilindrada: primaryNode.motorizacion.cilindradaCc,
      potencia: primaryNode.motorizacion.potenciaCv,
      puertas: primaryNode.caracteristicas.numeroPuertas,
      inicioFabricacion: "05/2009" //Falta el dato desde SISNET
    },
    tieneAccesoriosSeries: false,
    restoCampos: {
      tieneRemolque: false,
      tipoCarroceria: "Sin carroceria especial",
      fechaPrimeraMatriculacion: "15/05/2023",
      codigoPostalRegistro: "28001",
      provinciaRegistro: "Madrid"
    },
    accesoriosAdicionales: []
  };
}

export function mapToMarcasDomain(dtoList: ApiMarcaResponse[]): Marca[] {
  if (!dtoList) return [];
  return dtoList.map(dto => ({
    id: dto.codigo,
    nombre: dto.descripcion,
    // logo: `assets/logos/${dto.codigo.toLowerCase()}.png`
  }));
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
    id: node.version.id,
    nombre: node.version.nombre,
    combustible: node.motorizacion.combustible,
    cilindrada: node.motorizacion.cilindradaCc,
    potencia: node.motorizacion.potenciaCv,
    puertas: node.caracteristicas.numeroPuertas,
    inicioFabricacion: "05/2009"
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
