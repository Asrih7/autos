import { inject, Injectable } from "@angular/core";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { map, Observable, of } from "rxjs";
import {
  MetodoBusqueda,
  Marca,
  Modelo,
  VersionVehiculo,
  CarroceriaOption,
  AccesoriosAdicionales,
  VersionesCatalogPayload,
} from "../models/vehiculo.models";
import {
  ApiVehiculoResponse,
  ApiMarcaResponse,
  ApiModeloResponse,
  ApiCarroceriaResponse,
  ApiAccesorioResponse,
} from "../dtos/vehiculo.dto";
import {
  mapToAccesoriosDomain,
  mapToCarroceriasDomain,
  mapToMarcasDomain,
  mapToModelosDomain,
  mapToVersionesCatalogDomain,
} from "../mappers/vehiculo.mapper";
import { environment } from "../../../../environments/environment";

@Injectable({ providedIn: "root" })
export class VehiculoHttpService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiPaths.autos;

  buscarPorMatriculaOBastidor(
    metodo: MetodoBusqueda,
    valor: string,
  ): Observable<ApiVehiculoResponse> {
    const headers = new HttpHeaders({ lineaNegocio: "AU02" });

    let params = new HttpParams();
    if (metodo === "matricula") {
      params = params.set("matricula", valor);
    } else if (metodo === "bastidor") {
      params = params.set("bastidor", valor);
    }

    return this.http.get<ApiVehiculoResponse>(
      `${this.apiUrl}/vehiculo/busqueda`,
      { headers, params },
    );
  }

  getMarcas(tipoVehiculo?: number): Observable<Marca[]> {
    const headers = new HttpHeaders({ lineaNegocio: "AU02" });
    let params = new HttpParams();

    if (tipoVehiculo !== undefined && tipoVehiculo !== null) {
      params = params.set("tipoVehiculo", tipoVehiculo.toString());
    }

    return this.http
      .get<
        ApiMarcaResponse[]
      >(`${this.apiUrl}/catalogo/marcas`, { headers, params })
      .pipe(
        map((marcas: ApiMarcaResponse[]) => {
          const codigosVistos = new Set<string>();
          return marcas.filter((marca) => {
            if (codigosVistos.has(marca.codigo)) {
              return false;
            }
            codigosVistos.add(marca.codigo);
            return true;
          });
        }),
        map((apiMarcas) => mapToMarcasDomain(apiMarcas)),
      );
  }

  getModelosPorMarca(marcaId: string): Observable<Modelo[]> {
    const numericalBrandId = parseInt(marcaId, 10);
    const headers = new HttpHeaders({
      marca: numericalBrandId.toString(),
    });

    const params = new HttpParams().set("lineaNegocio", "AU02");

    return this.http
      .get<
        ApiModeloResponse[]
      >(`${this.apiUrl}/catalogo/modelos`, { headers, params })
      .pipe(map((apiModelos) => mapToModelosDomain(apiModelos)));
  }

  getVersionesPorModelo(
    modeloId: string,
    tipoVehiculo?: number,
  ): Observable<VersionesCatalogPayload> {
    const numericalModelId = parseInt(modeloId, 10);

    const headers = new HttpHeaders({
      "id-modelo": numericalModelId.toString(),
    });

    let params = new HttpParams().set("lineaNegocio", "AU02");

    if (tipoVehiculo !== undefined && tipoVehiculo !== null) {
      params = params.set("tipoVehiculo", tipoVehiculo.toString());
    }

    return this.http
      .get<ApiVehiculoResponse>(`${this.apiUrl}/catalogo/versiones`, {
        headers,
        params,
      })
      .pipe(
        map((apiResponse) => ({
          versiones: mapToVersionesCatalogDomain(apiResponse),
          versionMasContratada: apiResponse.versionMasContratada ? String(apiResponse.versionMasContratada) : null
        }))
      );
  }

  getOpcionesCarroceria(
    tipoVehiculo: number,
    codigoActividad: number,
  ): Observable<CarroceriaOption[]> {
    
    const headers = new HttpHeaders({
      tipoVehiculo: tipoVehiculo.toString(),
      codigoActividad: codigoActividad.toString()
    });

    return this.http
      .get<ApiCarroceriaResponse[]>(`${this.apiUrl}/catalogo/tipos-carrozado`, { headers })
      .pipe(
        map((apiCarrocerias) => mapToCarroceriasDomain(apiCarrocerias))
      );
  }

  getAccesoriosPorVehiculo(
    versionId: string,
  ): Observable<AccesoriosAdicionales[]> {
    const numericalVersionId = parseInt(versionId, 10);

    const headers = new HttpHeaders({
      version: numericalVersionId.toString()
    });

    return this.http.get<ApiAccesorioResponse[]>(
      `${this.apiUrl}/catalogo/accesorios`,
      { headers }
    ).pipe(
      map(apiAccesorios => mapToAccesoriosDomain(apiAccesorios))
    );
  }
}
