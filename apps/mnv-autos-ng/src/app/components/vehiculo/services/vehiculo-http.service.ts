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
  }

  getMarcas(tipoVehiculo: number): Observable<Marca[]> {
    const headers = new HttpHeaders({ lineaNegocio: "AU02" });
    const params = new HttpParams().set("tipoVehiculo", tipoVehiculo);

    return this.http.get<ApiMarcaResponse[]>(`${this.apiUrl}/catalogo/marcas`, { headers, params }).pipe(
      map(apiMarcas => mapToMarcasDomain(apiMarcas))
    );
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
  }

   getVersionesPorModelo(
    modeloId: string,
    tipoVehiculo: number // <-- Forzamos el tipado estricto a número
  ): Observable<VersionVehiculo[]> {
    const numericalModelId = parseInt(modeloId, 10) || 12345;

    const headers = new HttpHeaders({
      "id-modelo": numericalModelId.toString(),
    });

    const params = new HttpParams()
      .set("lineaNegocio", "AU02")
      .set("tipoVehiculo", tipoVehiculo.toString());

    return this.http.get<ApiVehiculoResponse>(`${this.apiUrl}/catalogo/versiones`, { headers, params }).pipe(
      map(apiResponse => mapToVersionesCatalogDomain(apiResponse))
    );
  }

  getOpcionesCarroceria(
    tipoVehiculo: number,
    codigoActividad: number
  ): Observable<CarroceriaOption[]> {
    
    // FIXED: Clean object initialization literal syntax mapping
    const headers = new HttpHeaders({
      'tipoVehiculo': tipoVehiculo.toString(),
      'codigoActividad': codigoActividad.toString()
    });

    return this.http.get<ApiCarroceriaResponse[]>(`${this.apiUrl}/catalogo/carroceria`, { headers }).pipe(
      map(apiCarrocerias => mapToCarroceriasDomain(apiCarrocerias))
    );
  }

  getAccesoriosPorVehiculo(
    versionId: string,
  ): Observable<AccesoriosAdicionales[]> {
    // 1. Convert string token safely to base-10 integer, falling back to 98765 if blank
    const numericalVersionId = parseInt(versionId, 10) || 98765;

    // 2. Set strict header key matching your lowercase Swagger criteria parameter name
    const headers = new HttpHeaders({
      'version': numericalVersionId.toString(),
    });

    return this.http.get<ApiAccesorioResponse[]>(`${this.apiUrl}/catalogo/accesorios`, { headers }).pipe(
      map(apiAccesorios => mapToAccesoriosDomain(apiAccesorios))
    );
  }

}
