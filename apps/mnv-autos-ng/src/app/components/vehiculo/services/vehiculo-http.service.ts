import { inject, Injectable } from "@angular/core";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { delay, map, Observable, of, throwError } from "rxjs";
import {
  Vehiculo,
  MetodoBusqueda,
  Marca,
  Modelo,
  VersionVehiculo,
  CarroceriaOption,
  AccesoriosAdicionales,
} from "../models/vehiculo.models";
import {
  ApiVehiculoResponse,
  ApiMarcaResponse,
  ApiModeloResponse,
  ApiCarroceriaResponse,
  ApiAccesorioResponse,
} from "../dtos/vehiculo.dto";
import {
  mapToVehiculoDomain,
  mapToMarcasDomain,
  mapToModelosDomain,
  mapToVersionesCatalogDomain,
  mapToCarroceriasDomain,
  mapToAccesoriosDomain,
} from "../mappers/vehiculo.mapper";
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: "root" })
export class VehiculoHttpService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiPaths.autos; 

  buscarPorMatriculaOBastidor(
    metodo: MetodoBusqueda,
    valor: string,
  ): Observable<Vehiculo> {
    const headers = new HttpHeaders({ lineaNegocio: "AU02" });

    let params = new HttpParams();
    if (metodo === "matricula") {
      params = params.set("matricula", valor);
    } else if (metodo === "bastidor") {
      params = params.set("bastidor", valor);
    }

    return this.http.get<ApiVehiculoResponse>(`${this.apiUrl}/vehiculo/busqueda`, { headers, params }).pipe(
      map(apiResponse => mapToVehiculoDomain(apiResponse))
    );

    // if (valor.startsWith("9999")) {
    //   return throwError(() => new Error("vehiculo.errors.noEncontrado")).pipe(
    //     delay(1200),
    //   );
    // }

    // const mockApiResponse: ApiVehiculoResponse = {
    //   versionMasContratada: 0,
    //   codigoActividad: "ACT-100",
    //   versiones: [
    //     {
    //       version: { id: "v1", nombre: "SUMMUM 7PZ" },
    //       clasificacion: {
    //         categoriaVehiculo: "M1",
    //         tipoVehiculo: "Turismo",
    //         claseVehiculo: "A",
    //       },
    //       marca: { id: "kia", nombre: "Kia" },
    //       modelo: { id: "golf", nombre: "Golf" },
    //       caracteristicas: {
    //         numeroPuertas: "5 puertas",
    //         numeroPlazas: "7",
    //         medidaNeumaticos: "235/60 R18",
    //       },
    //       motorizacion: {
    //         combustible: "Diesel",
    //         cilindradaCc: "1800",
    //         potenciaCv: "150 cv",
    //         potenciaKw: "110 kw",
    //         velocidadMaxima: "195",
    //       },
    //       comercial: { precioOficial: "42000", precioVentaPublico: "39500" },
    //       origen: "Nacional",
    //     },
    //   ],
    // };

    // return of(mockApiResponse).pipe(
    //   delay(1500),
    //   map((apiResponse) => mapToVehiculoDomain(apiResponse)),
    // );
  }

  getMarcas(): Observable<Marca[]> {
    const headers = new HttpHeaders({ lineaNegocio: "AU02" });
    const params = new HttpParams().set("tipoVehiculo", 1);

    return this.http.get<ApiMarcaResponse[]>(`${this.apiUrl}/catalogo/marcas`, { headers, params }).pipe(
      map(apiMarcas => mapToMarcasDomain(apiMarcas))
    );

    // const mockApiMarcas: ApiMarcaResponse[] = [
    //   { codigo: "aud", descripcion: "Audi", orden: 1 },
    //   { codigo: "dac", descripcion: "Dacia", orden: 2 },
    //   { codigo: "fia", descripcion: "Fiat", orden: 3 },
    //   { codigo: "hyu", descripcion: "Hyundai", orden: 4 },
    //   { codigo: "kia", descripcion: "Kia", orden: 5 },
    //   { codigo: "nis", descripcion: "Nissan", orden: 6 },
    //   { codigo: "jee", descripcion: "Jeep", orden: 7 },
    //   { codigo: "for", descripcion: "Ford", orden: 8 },
    // ];

    // return of(mockApiMarcas).pipe(
    //   delay(800),
    //   map((apiMarcas) => mapToMarcasDomain(apiMarcas)),
    // );
  }

  getModelosPorMarca(marcaId: string): Observable<Modelo[]> {
    const numericalBrandId = parseInt(marcaId, 10) || 100;
    const headers = new HttpHeaders({
      marca: numericalBrandId.toString(),
    });

    const params = new HttpParams().set("lineaNegocio", "AU02");

    return this.http.get<ApiModeloResponse[]>(`${this.apiUrl}/catalogo/modelos`, { headers, params }).pipe(
      map(apiModelos => mapToModelosDomain(apiModelos))
    );

    // const mockApiModelos: ApiModeloResponse[] = [
    //   { codigo: "golf", descripcion: "Golf" },
    //   { codigo: "polo", descripcion: "Polo" },
    //   { codigo: "passat", descripcion: "Passat" },
    // ];

    // return of(mockApiModelos).pipe(
    //   delay(600),
    //   map((apiModelos) => mapToModelosDomain(apiModelos)),
    // );
  }

  getVersionesPorModelo(
    marcaId: string,
    modeloId: string,
  ): Observable<VersionVehiculo[]> {
    const numericalModelId = parseInt(modeloId, 10) || 12345;

    const headers = new HttpHeaders({
      "id-modelo": numericalModelId.toString(),
    });

    const params = new HttpParams()
      .set("lineaNegocio", "AU02")
      .set("tipoVehiculo", "1");

    return this.http.get<ApiVehiculoResponse>(`${this.apiUrl}/catalogo/versiones`, { headers, params }).pipe(
      map(apiResponse => mapToVersionesCatalogDomain(apiResponse))
    );

    // const mockApiResponse: ApiVehiculoResponse = {
    //   versionMasContratada: 0,
    //   codigoActividad: "ACT-100",
    //   versiones: [
    //     {
    //       version: { id: "v1", nombre: "SUMMUM 7PZ" },
    //       clasificacion: { categoriaVehiculo: "M1", tipoVehiculo: "Turismo", claseVehiculo: "A" },
    //       marca: { id: "kia", nombre: "Kia" },
    //       modelo: { id: "golf", nombre: "Golf" },
    //       caracteristicas: { numeroPuertas: "5 puertas", numeroPlazas: "7", medidaNeumaticos: "235/60 R18" },
    //       motorizacion: { combustible: "Diesel", cilindradaCc: "1800", potenciaCv: "150 cv", potenciaKw: "110 kw", velocidadMaxima: "195" },
    //       comercial: { precioOficial: "42000", precioVentaPublico: "39500" },
    //       origen: "Nacional",
    //     },
    //     {
    //       version: { id: "v2", nombre: "SUMMUM AUTO 7PZ" },
    //       clasificacion: { categoriaVehiculo: "M1", tipoVehiculo: "Turismo", claseVehiculo: "A" },
    //       marca: { id: "kia", nombre: "Kia" },
    //       modelo: { id: "golf", nombre: "Golf" },
    //       caracteristicas: { numeroPuertas: "5 puertas", numeroPlazas: "7", medidaNeumaticos: "235/60 R18" },
    //       motorizacion: { combustible: "Gas", cilindradaCc: "2000", potenciaCv: "200 cv", potenciaKw: "147 kw", velocidadMaxima: "210" },
    //       comercial: { precioOficial: "45000", precioVentaPublico: "42500" },
    //       origen: "Nacional",
    //     },
    //     {
    //       version: { id: "v3", nombre: "R-DESIGN 7PZ" },
    //       clasificacion: { categoriaVehiculo: "M1", tipoVehiculo: "Turismo", claseVehiculo: "A" },
    //       marca: { id: "kia", nombre: "Kia" },
    //       modelo: { id: "golf", nombre: "Golf" },
    //       caracteristicas: { numeroPuertas: "5 puertas", numeroPlazas: "7", medidaNeumaticos: "235/60 R18" },
    //       motorizacion: { combustible: "Diesel", cilindradaCc: "1500", potenciaCv: "190 cv", potenciaKw: "140 kw", velocidadMaxima: "205" },
    //       comercial: { precioOficial: "48000", precioVentaPublico: "45000" },
    //       origen: "Nacional",
    //     },
    //   ],
    // };

    // return of(mockApiResponse).pipe(
    //   delay(750),
    //   map((apiResponse) => mapToVersionesCatalogDomain(apiResponse)),
    // );
  }

  getOpcionesCarroceria(): Observable<CarroceriaOption[]> {
    const headers = new HttpHeaders({
      tipoVehiculo: "1",
      codigoActividad: "25",
    });

    return this.http.get<ApiCarroceriaResponse[]>(`${this.apiUrl}/catalogo/carroceria`, { headers }).pipe(
      map(apiCarrocerias => mapToCarroceriasDomain(apiCarrocerias))
    );

    // const mockApiCarrocerias: ApiCarroceriaResponse[] = [
    //   { codigo: "1", descripcion: "Sin carroceria especial" },
    //   { codigo: "2", descripcion: "Furgón" },
    //   { codigo: "3", descripcion: "Camión" },
    // ];

    // return of(mockApiCarrocerias).pipe(
    //   delay(500),
    //   map((apiCarrocerias) => mapToCarroceriasDomain(apiCarrocerias)),
    // );
  }

  getAccesoriosPorVehiculo(
    versionId: string,
  ): Observable<AccesoriosAdicionales[]> {
    const numericalVersionId = parseInt(versionId, 10) || 98765;

    const headers = new HttpHeaders({
      version: numericalVersionId.toString(),
    });

    return this.http.get<ApiAccesorioResponse[]>(`${this.apiUrl}/catalogo/accesorios`, { headers }).pipe(
      map(apiAccesorios => mapToAccesoriosDomain(apiAccesorios))
    );

    // const mockApiAccesorios: ApiAccesorioResponse[] = [
    //   { idAccesorio: 101, idModeloVehiculo: 99, codigoAccesorio: "ACC01", anyoAccesorio: "2024", mesAccesorio: 1, importeAccesorio: 234, descripcionAccesorio: "Alarma", tipoAccesorio: "Seguridad" },
    //   { idAccesorio: 102, idModeloVehiculo: 99, codigoAccesorio: "ACC02", anyoAccesorio: "2024", mesAccesorio: 1, importeAccesorio: 500, descripcionAccesorio: "Alarma antirrobo hasta 400 €", tipoAccesorio: "Seguridad" },
    //   { idAccesorio: 103, idModeloVehiculo: 99, codigoAccesorio: "ACC03", anyoAccesorio: "2024", mesAccesorio: 1, importeAccesorio: 781, descripcionAccesorio: "Arranque codificado", tipoAccesorio: "Seguridad" },
    //   { idAccesorio: 201, idModeloVehiculo: 99, codigoAccesorio: "ACC04", anyoAccesorio: "2024", mesAccesorio: 1, importeAccesorio: 312, descripcionAccesorio: "Cierre centralizado", tipoAccesorio: "Sonido y multimedia" },
    //   { idAccesorio: 301, idModeloVehiculo: 99, codigoAccesorio: "FAC01", anyoAccesorio: "2024", mesAccesorio: 1, importeAccesorio: 1200, descripcionAccesorio: "Navegador Satélite Oficial", tipoAccesorio: "Fabricante" },
    // ];

    // return of(mockApiAccesorios).pipe(
    //   delay(850),
    //   map((apiAccesorios) => mapToAccesoriosDomain(apiAccesorios)),
    // );
  }
}
