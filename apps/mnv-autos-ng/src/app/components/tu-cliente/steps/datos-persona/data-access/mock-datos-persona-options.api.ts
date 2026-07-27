import { Injectable, type Provider } from '@angular/core';
import { of, type Observable } from 'rxjs';
import {
  DATOS_PERSONA_OPTIONS_API,
  type DatosPersonaOptions,
  type DatosPersonaOptionsApi,
} from './datos-persona-options.api';

export const MOCK_DATOS_PERSONA_OPTIONS: DatosPersonaOptions = {
  documentTypes: [
    { value: 'dni', label: 'DNI' },
    { value: 'nif', label: 'NIF' },
    { value: 'cif', label: 'CIF' },
    { value: 'passport', label: 'Pasaporte' },
  ],
  nationalities: [
    { value: 'es', label: 'Española' },
    { value: 'de', label: 'Alemana' },
    { value: 'fr', label: 'Francesa' },
    { value: 'it', label: 'Italiana' },
    { value: 'pt', label: 'Portuguesa' },
    { value: 'gb', label: 'Británica' },
    { value: 'us', label: 'Estadounidense' },
    { value: 'mx', label: 'Mexicana' },
    { value: 'ar', label: 'Argentina' },
    { value: 'co', label: 'Colombiana' },
    { value: 'other', label: 'Otra' },
  ],
};

@Injectable()
export class MockDatosPersonaOptionsApi implements DatosPersonaOptionsApi {
  getOptions(): Observable<DatosPersonaOptions> {
    return of(MOCK_DATOS_PERSONA_OPTIONS);
  }
}

export function provideMockDatosPersonaOptionsApi(): Provider {
  return {
    provide: DATOS_PERSONA_OPTIONS_API,
    useClass: MockDatosPersonaOptionsApi,
  };
}
