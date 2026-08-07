import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from './../../../../../../../apps/mnv-autos-ng/src/environments/environment';
import {
  ApiClienteDatosPersonalesRequest,
  ApiDatosBusquedaCliente,
} from '../dto/cliente-busqueda.dto';
import { mapApiDatosBusquedaCliente } from '../mapper/cliente-busqueda.mapper';

@Injectable({ providedIn: 'root' })
export class ClienteBusquedaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiPaths.autos;

  buscarCliente(
    documento: string,
    tipoDocumento: string,
  ): Observable<ReturnType<typeof mapApiDatosBusquedaCliente>> {
    const payload: ApiClienteDatosPersonalesRequest = {
      documento,
      codCiaDgs: 'C0031',
      nombre: '',
      apellido1: '',
      apellido2: '',
      razonSocial: '',
      telefono: '',
      email: '',
      mediador: 'B24242067',
      puntoVenta: '',
      csb: '',
      oficina: '',
      usuario: 'PORTAL2103',
      aplicacion: '',
      consultarProspect: '',
      idioma: '',
    };

    return this.http.post<ApiDatosBusquedaCliente>(`${this.apiUrl}/clientes/buscarDatosCliente`, payload).pipe(
      map((response) => mapApiDatosBusquedaCliente(response, tipoDocumento)),
    );
  }
}
