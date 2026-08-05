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

  const mockCarroceria: CarroceriaOption[] = [
    { codigo: "BERLINA", descripcion: "Vehículo tipo berlina" },
    { codigo: "SUV", descripcion: "Vehículo deportivo utilitario" },
    { codigo: "COUPE", descripcion: "Vehículo coupé de dos puertas" },
    { codigo: "CABRIO", descripcion: "Vehículo descapotable" },
    { codigo: "FAMILIAR", descripcion: "Vehículo familiar / station wagon" },
    { codigo: "PICKUP", descripcion: "Vehículo pickup con caja trasera" },
    { codigo: "HATCHBACK", descripcion: "Vehículo compacto hatchback" },
    { codigo: "MONOVOLUMEN", descripcion: "Vehículo monovolumen / MPV" },
    { codigo: "ROADSTER", descripcion: "Vehículo roadster deportivo" },
    { codigo: "VAN", descripcion: "Vehículo tipo furgoneta" }
  ];

  return of(mockCarroceria);

  /*
  // Cuando Java esté implementado, descomentas esto:
  const headers = new HttpHeaders({
    'tipoVehiculo': tipoVehiculo.toString(),
    'codigoActividad': codigoActividad.toString()
  });

  return this.http.get<ApiCarroceriaResponse[]>(
    `${this.apiUrl}/catalogo/carroceria`,
    { headers }
  ).pipe(
    map(apiCarrocerias => mapToCarroceriasDomain(apiCarrocerias))
  );
  */
}


 getAccesoriosPorVehiculo(versionId: string): Observable<AccesoriosAdicionales[]> {

  // --- MOCK REALISTA MIENTRAS EL BACKEND NO ESTÁ LISTO ---
  const mockAccesorios: AccesoriosAdicionales[] = [
    {
      checked: false,
      idAccesorio: 101,
      idModeloVehiculo: 2001,
      codigoAccesorio: "CLIMATIZADOR_BIZONA",
      anyoAccesorio: "2024",
      mesAccesorio: 6,
      importeAccesorio: 450.75,
      descripcionAccesorio: "Climatizador automático bizona",
      tipoAccesorio: "CONFORT"
    },
    {
      checked: false,
      idAccesorio: 102,
      idModeloVehiculo: 2001,
      codigoAccesorio: "LLANTAS_18",
      anyoAccesorio: "2024",
      mesAccesorio: 6,
      importeAccesorio: 820.00,
      descripcionAccesorio: "Llantas de aleación de 18 pulgadas",
      tipoAccesorio: "ESTÉTICO"
    },
    {
      checked: false,
      idAccesorio: 103,
      idModeloVehiculo: 2001,
      codigoAccesorio: "SENSOR_APARCAMIENTO",
      anyoAccesorio: "2023",
      mesAccesorio: 11,
      importeAccesorio: 300.50,
      descripcionAccesorio: "Sensores de aparcamiento delanteros y traseros",
      tipoAccesorio: "SEGURIDAD"
    },
    {
      checked: false,
      idAccesorio: 104,
      idModeloVehiculo: 2001,
      codigoAccesorio: "CAMARA_TRASERA",
      anyoAccesorio: "2023",
      mesAccesorio: 11,
      importeAccesorio: 410.00,
      descripcionAccesorio: "Cámara de visión trasera HD",
      tipoAccesorio: "SEGURIDAD"
    },
    {
      checked: false,
      idAccesorio: 105,
      idModeloVehiculo: 2001,
      codigoAccesorio: "NAVEGADOR_GPS",
      anyoAccesorio: "2024",
      mesAccesorio: 1,
      importeAccesorio: 650.00,
      descripcionAccesorio: "Sistema de navegación GPS integrado",
      tipoAccesorio: "TECNOLOGÍA"
    }
  ];

  return of(mockAccesorios);

  // --- LLAMADA REAL (DESCOMENTAR CUANDO JAVA FUNCIONE) ---
  /*
  const numericalVersionId = parseInt(versionId, 10) || 98765;

  const headers = new HttpHeaders({
    version: numericalVersionId.toString()
  });

  return this.http.get<ApiAccesorioResponse[]>(
    `${this.apiUrl}/catalogo/accesorios`,
    { headers }
  ).pipe(
    map(apiAccesorios => mapToAccesoriosDomain(apiAccesorios))
  );
  */
}

}
