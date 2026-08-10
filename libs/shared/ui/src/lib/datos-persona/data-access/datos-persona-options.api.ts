import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { DatosPersonaOption, DatosPersonaOptions } from './datos-persona-options.model';

export interface DatosPersonaOptionsApi {
  getOptions(): Observable<DatosPersonaOptions>;
}

export const DATOS_PERSONA_OPTIONS_API = new InjectionToken<DatosPersonaOptionsApi>(
  'DATOS_PERSONA_OPTIONS_API',
);
