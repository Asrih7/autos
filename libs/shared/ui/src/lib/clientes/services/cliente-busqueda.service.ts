import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../../../apps/mnv-autos-ng/src/environments/environment';
import {
  ApiClienteDatosPersonalesRequest,
  ApiDatosBusquedaCliente,
} from '../cliente-busqueda.dto';
import { mapApiDatosBusquedaCliente } from '../cliente-busqueda.mapper';

@Injectable({ providedIn: 'root' })
export class ClienteBusquedaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiPaths.autos;

  buscarCliente(documento: string): Observable<ReturnType<typeof mapApiDatosBusquedaCliente>> {
    const payload: ApiClienteDatosPersonalesRequest = {
      documento,
      usuario: environment.technicalCredentials.usuario,
      aplicacion: environment.sso.clientId || 'front-desktop',
      consultarProspect: 'true',
      idioma: 'ES',
    };

    return this.http.post<ApiDatosBusquedaCliente>(`${this.apiUrl}/clientes/buscarDatosCliente`, payload).pipe(
      map(mapApiDatosBusquedaCliente),
    );
  }
}
