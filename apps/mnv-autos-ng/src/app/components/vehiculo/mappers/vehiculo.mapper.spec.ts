import { describe, it, expect } from 'vitest';
import { 
  ApiVehiculoResponse, 
  ApiMarcaResponse, 
  ApiModeloResponse, 
  ApiCarroceriaResponse, 
  ApiAccesorioResponse 
} from '../dtos/vehiculo.dto';
import { 
  mapToVehiculoDomain, 
  mapToMarcasDomain, 
  mapToModelosDomain, 
  mapToVersionesCatalogDomain, 
  mapToCarroceriasDomain, 
  mapToAccesoriosDomain 
} from './vehiculo.mapper';

describe('Vehiculo Mappers Suite', () => {

  describe('mapToVehiculoDomain', () => {
    it('should map a valid ApiVehiculoResponse to a Vehiculo domain model', () => {
      const mockDto: ApiVehiculoResponse = {
        versionMasContratada: 0,
        codigoActividad: 'ACT-100',
        versiones: [
          {
            version: { id: 'V_99', nombre: 'Test Version Name' },
            clasificacion: { categoriaVehiculo: 'M1', tipoVehiculo: 'Turismo', claseVehiculo: 'A' },
            marca: { id: 'KIA', nombre: 'Kia Motors' },
            modelo: { id: 'GOLF', nombre: 'Golf Style' },
            caracteristicas: { numeroPuertas: '5', numeroPlazas: '5', medidaNeumaticos: '205/55 R16' },
            motorizacion: { combustible: 'Híbrido', cilindradaCc: '1598', potenciaCv: '141 cv', potenciaKw: '104 kw', velocidadMaxima: '175' },
            comercial: { precioOficial: '30000', precioVentaPublico: '28500' },
            origen: 'Nacional'
          }
        ]
      };

      const result = mapToVehiculoDomain(mockDto);

      expect(result.marca.id).toBe('KIA');
      expect(result.marca.nombre).toBe('Kia Motors');
      expect(result.modelo.id).toBe('GOLF');
      expect(result.version.id).toBe('V_99');
      expect(result.version.combustible).toBe('Híbrido');
      expect(result.version.cilindrada).toBe('1598');
      expect(result.version.potencia).toBe('141 cv');
      expect(result.version.puertas).toBe('5');
      expect(result.tieneAccesoriosSeries).toBe(false);
      expect(result.restoCampos.tieneRemolque).toBe(false);
      expect(result.accesoriosAdicionales).toBeInstanceOf(Array);
      expect(result.accesoriosAdicionales).toHaveLength(0);
    });

    it('should throw an error if the response contains empty or missing versions', () => {
      const emptyDto: ApiVehiculoResponse = {
        versionMasContratada: 0,
        codigoActividad: 'ACT-100',
        versiones: []
      };

      expect(() => mapToVehiculoDomain(emptyDto)).toThrowError('vehiculo.errors.noEncontrado');
    });
  });

  describe('mapToMarcasDomain', () => {
    it('should map an array of ApiMarcaResponse to a clean array of Marca entities', () => {
      const mockDtoList: ApiMarcaResponse[] = [
        { codigo: 'AUD', descripcion: 'Audi', orden: 1 },
        { codigo: 'KIA', descripcion: 'Kia', orden: 2 }
      ];

      const result = mapToMarcasDomain(mockDtoList);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'AUD',
        nombre: 'Audi',
      });
    });

    it('should return an empty array if incoming list configuration is falsy', () => {
      expect(mapToMarcasDomain(null as any)).toHaveLength(0);
    });
  });

  describe('mapToModelosDomain', () => {
    it('should map an array of ApiModeloResponse to a clean array of Modelo entities', () => {
      const mockDtoList: ApiModeloResponse[] = [
        { codigo: 'GOLF', descripcion: 'Golf' }
      ];

      const result = mapToModelosDomain(mockDtoList);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'GOLF',
        nombre: 'Golf'
      });
    });
  });

  describe('mapToVersionesCatalogDomain', () => {
    it('should map version entries out of an ApiVehiculoResponse envelope into flat catalog entities', () => {
      const mockDto: ApiVehiculoResponse = {
        versionMasContratada: 0,
        codigoActividad: 'ACT-100',
        versiones: [
          {
            version: { id: 'v1', nombre: 'SUMMUM 7PZ' },
            clasificacion: { categoriaVehiculo: 'M1', tipoVehiculo: 'Turismo', claseVehiculo: 'A' },
            marca: { id: 'kia', nombre: 'Kia' },
            modelo: { id: 'golf', nombre: 'Golf' },
            caracteristicas: { numeroPuertas: '5 puertas', numeroPlazas: '7', medidaNeumaticos: '235/60 R18' },
            motorizacion: { combustible: 'Diesel', cilindradaCc: '1800', potenciaCv: '150 cv', potenciaKw: '110 kw', velocidadMaxima: '195' },
            comercial: { precioOficial: '42000', precioVentaPublico: '39500' },
            origen: 'Nacional'
          }
        ]
      };

      const result = mapToVersionesCatalogDomain(mockDto);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'v1',
        nombre: 'SUMMUM 7PZ',
        combustible: 'Diesel',
        cilindrada: '1800',
        potencia: '150 cv',
        puertas: '5 puertas',
        inicioFabricacion: '05/2009'
      });
    });
  });

  describe('mapToCarroceriasDomain', () => {
    it('should map ApiCarroceriaResponse keys to CarroceriaOption interface definitions', () => {
      const mockDtoList: ApiCarroceriaResponse[] = [
        { codigo: '1', descripcion: 'Sin carroceria especial' }
      ];

      const result = mapToCarroceriasDomain(mockDtoList);

      expect(result[0]).toMatchObject({
        codigo: '1',
        descripcion: 'Sin carroceria especial'
      });
    });
  });

  describe('mapToAccesoriosDomain', () => {
    it('should map an ApiAccesorioResponse array and initialize local checked selection flags to false', () => {
      const mockDtoList: ApiAccesorioResponse[] = [
        {
          idAccesorio: 101,
          idModeloVehiculo: 99,
          codigoAccesorio: 'ACC01',
          anyoAccesorio: '2024',
          mesAccesorio: 1,
          importeAccesorio: 234,
          descripcionAccesorio: 'Alarma',
          tipoAccesorio: 'Seguridad'
        }
      ];

      const result = mapToAccesoriosDomain(mockDtoList);

      expect(result).toHaveLength(1);
      expect(result[0].checked).toBe(false);
      expect(result[0].idAccesorio).toBe(101);
      expect(result[0].descripcionAccesorio).toBe('Alarma');
    });
  });
});
