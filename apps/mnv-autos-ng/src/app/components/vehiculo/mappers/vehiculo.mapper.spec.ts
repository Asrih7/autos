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
    it('should map a valid ApiVehiculoResponse to a Vehiculo domain model using allowlist rules', () => {
      const mockDto: ApiVehiculoResponse = {
        versionMasContratada: 12345,
        codigoActividad: 'ACT-100',
        versiones: [
          {
            version: { id: 'V_99', nombre: 'Test Version Name' },
            clasificacion: { categoriaVehiculo: 'M1', tipoVehiculo: '100', claseVehiculo: 'A' },
            marca: { id: '7', nombre: 'Kia Motors' }, 
            modelo: { id: 'GOLF', nombre: 'Golf Style' },
            caracteristicas: { numeroPuertas: '5', numeroPlazas: '5', medidaNeumaticos: '205/55 R16' },
            motorizacion: { combustible: 'Híbrido', cilindradaCc: '1598', potenciaCv: '141 cv', potenciaKw: '104 kw', velocidadMaxima: '175' },
            comercial: { precioOficial: '30000', precioVentaPublico: '28500', anioLanzamiento: 2007 },
            origen: 'Nacional'
          }
        ]
      };

      const result = mapToVehiculoDomain(mockDto);

      expect(result.codigoActividad).toBe('ACT-100');
      expect(result.clasificacion.tipoVehiculo).toBe('100');
      expect(result.marca.id).toBe('7');
      expect(result.marca.nombre).toBe('Kia Motors');
      
      expect(result.marca.logo).toBe('assets/images/marcas/7.png');
      
      expect(result.modelo.id).toBe('GOLF');
      expect(result.version.id).toBe('V_99');
      expect(result.version.combustible).toBe('Híbrido');
      expect(result.version.cilindrada).toBe('1598');
      expect(result.version.potencia).toBe('141 cv');
      expect(result.version.puertas).toBe('5');
      expect(result.version.inicioFabricacion).toBe('2007');
      expect(result.tieneAccesoriosSeries).toBe(false);
      
      expect(result.restoCampos).toMatchObject({
        tieneRemolque: false,
        tipoCarroceria: '',
        fechaPrimeraMatriculacion: '',
        codigoPostalRegistro: '',
        provinciaRegistro: ''
      });
      
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
    it('should map an array of ApiMarcaResponse resolving to code matching configurations or fallback paths', () => {
      const mockDtoList: ApiMarcaResponse[] = [
        { codigo: '25', descripcion: 'Audi', orden: 1 },
        { codigo: '999', descripcion: 'Rare Brand', orden: 2 }
      ];

      const result = mapToMarcasDomain(mockDtoList);

      expect(result).toHaveLength(2);
      
      expect(result[0]).toMatchObject({
        id: '25',
        nombre: 'Audi',
        logo: 'assets/images/marcas/25.png'
      });

      expect(result[1]).toMatchObject({
        id: '999',
        nombre: 'Rare Brand',
        logo: 'assets/images/marcas/noexiste.png'
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
            comercial: { precioOficial: '42000', precioVentaPublico: '39500', anioLanzamiento: 2007 },
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
        inicioFabricacion: '2007'
      });
    });
  });

  describe('mapToCarroceriasDomain', () => {
    it('should map ApiCarroceriaResponse keys to CarroceriaOption interface definitions', () => {
      const mockDtoList: ApiCarroceriaResponse[] = [
        { codigo: 'BERLINA', descripcion: 'Vehículo tipo berlina' }
      ];

      const result = mapToCarroceriasDomain(mockDtoList);

      expect(result[0]).toMatchObject({
        codigo: 'BERLINA',
        descripcion: 'Vehículo tipo berlina'
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
