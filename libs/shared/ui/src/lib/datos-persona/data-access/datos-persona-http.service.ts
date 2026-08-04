import { HttpClient } from '@angular/common/http';
import { inject, Injectable, type Provider } from '@angular/core';
import { environment } from 'apps/mnv-autos-ng/src/environments/environment';
import { DATOS_PERSONA_OPTIONS_API, type DatosPersonaOptionsApi } from './datos-persona-options.api';
import type { DatosPersonaOptions } from './datos-persona-options.model';
import { catchError, map, of, type Observable } from 'rxjs';

import { DOCUMENT_TYPES } from './mock-datos-persona-options';

@Injectable({ providedIn: 'root' })
export class DatosPersonaHttpService implements DatosPersonaOptionsApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiPaths.autos;

  getOptions(): Observable<DatosPersonaOptions> {
    return this.http.get<ApiPaisResponse[]>(`${this.apiUrl}/catalogo/paises`).pipe(
      map((apiPaises) => ({
        documentTypes: DOCUMENT_TYPES,
        nationalities: apiPaises.map(({ codigo, descripcion }) => ({ value: codigo, label: descripcion })),
      })),
      catchError(() =>
        of({
          documentTypes: DOCUMENT_TYPES,
          nationalities: [],
        }),
      ),
    );
  }
}

interface ApiPaisResponse {
  readonly codigo: string;
  readonly descripcion: string;
}

export function provideDatosPersonaOptionsApi(): Provider {
  return {
    provide: DATOS_PERSONA_OPTIONS_API,
    useExisting: DatosPersonaHttpService,
  };
}
