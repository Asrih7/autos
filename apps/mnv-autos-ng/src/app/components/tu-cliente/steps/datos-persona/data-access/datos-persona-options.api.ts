import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

export interface DatosPersonaOption {
  readonly value: string;
  readonly label: string;
}

export interface DatosPersonaOptions {
  readonly documentTypes: readonly DatosPersonaOption[];
  readonly nationalities: readonly DatosPersonaOption[];
}

export interface DatosPersonaOptionsApi {
  getOptions(): Observable<DatosPersonaOptions>;
}

export const DATOS_PERSONA_OPTIONS_API = new InjectionToken<DatosPersonaOptionsApi>(
  'DATOS_PERSONA_OPTIONS_API',
);
