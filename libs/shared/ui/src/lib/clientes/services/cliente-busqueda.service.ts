import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import { environment } from 'apps/mnv-autos-ng/src/environments/environment';
import {
  ApiClienteDatosPersonalesRequest,
  ApiDatosBusquedaCliente,
  ApiNormalizarNombreRequest,
  ApiNormalizarNombreResponse,
} from '../dto/cliente-busqueda.dto';
import { mapApiDatosBusquedaCliente } from '../mapper/cliente-busqueda.mapper';
import type { DatosPersonaModel } from '../../datos-persona/models/datos-persona.model';

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

  normalizarNombre(persona: DatosPersonaModel): Observable<DatosPersonaModel> {
    if (persona.documentType === 'cif') {
      return of(persona);
    }

    const payload: ApiNormalizarNombreRequest = {
      nombre: persona.firstName,
      apellido1: persona.firstSurname,
      apellido2: persona.secondSurname,
      sexo: '',
      usuario: environment.technicalCredentials.usuario,
      aplicacion: environment.sso.clientId || 'front-desktop',
    };

    return this.http.post<ApiNormalizarNombreResponse>(`${this.apiUrl}/normalizar/nombre`, payload).pipe(
      map((response) => {
        if (response.error && response.error !== 0) {
          throw new Error('Nombre no válido');
        }

        return {
          ...persona,
          firstName: response.nombre?.trim() || persona.firstName,
          firstSurname: response.apellido1?.trim() || persona.firstSurname,
          secondSurname: response.apellido2?.trim() || persona.secondSurname,
        };
      }),
    );
  }
}
