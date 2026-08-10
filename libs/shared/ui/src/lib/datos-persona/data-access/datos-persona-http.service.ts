import { HttpClient } from '@angular/common/http';
import { inject, Injectable, type Provider } from '@angular/core';
import { DATOS_PERSONA_OPTIONS_API, type DatosPersonaOptionsApi } from './datos-persona-options.api';
import type { DatosPersonaOptions } from './datos-persona-options.model';
import { map, of, type Observable } from 'rxjs';
import { environment } from '../../../../../../../apps/mnv-autos-ng/src/environments/environment';
import type { DatosPersonaModel } from '../models/datos-persona.model';
import type {
  ApiNormalizarNombreRequest,
  ApiNormalizarNombreResponse,
} from '../dto/datos-person.dto';

import { DOCUMENT_TYPES, NATIONALITIES } from './mock-datos-persona-options';

@Injectable({ providedIn: 'root' })
export class DatosPersonaHttpService implements DatosPersonaOptionsApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiPaths.autos;

  getOptions(): Observable<DatosPersonaOptions> {
    return of({
      documentTypes: DOCUMENT_TYPES,
      nationalities: NATIONALITIES,
    });
  }

  normalizeName(persona: DatosPersonaModel): Observable<DatosPersonaModel> {
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

export function provideDatosPersonaOptionsApi(): Provider {
  return {
    provide: DATOS_PERSONA_OPTIONS_API,
    useExisting: DatosPersonaHttpService,
  };
}
