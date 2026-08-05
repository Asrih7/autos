import { Injectable, type Provider } from '@angular/core';
import { DATOS_PERSONA_OPTIONS_API, type DatosPersonaOptionsApi } from './datos-persona-options.api';
import type { DatosPersonaOptions } from './datos-persona-options.model';
import { of, type Observable } from 'rxjs';

import { DOCUMENT_TYPES, NATIONALITIES } from './mock-datos-persona-options';

@Injectable({ providedIn: 'root' })
export class DatosPersonaHttpService implements DatosPersonaOptionsApi {
  getOptions(): Observable<DatosPersonaOptions> {
    return of({
      documentTypes: DOCUMENT_TYPES,
      nationalities: NATIONALITIES,
    });
  }
}

export function provideDatosPersonaOptionsApi(): Provider {
  return {
    provide: DATOS_PERSONA_OPTIONS_API,
    useExisting: DatosPersonaHttpService,
  };
}
