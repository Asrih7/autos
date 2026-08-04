import { HttpClient } from '@angular/common/http';
import { inject, Injectable, type Provider } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';
import {
    DATOS_PERSONA_OPTIONS_API,
    type DatosPersonaOptions,
    type DatosPersonaOptionsApi,
} from './datos-persona-options.api';
import type { ApiPaisResponse } from './datos-persona.dto';
import { mapToNacionalidadesDomain } from './datos-persona.mapper';

const DOCUMENT_TYPES = [
    { value: 'dni', label: 'DNI' },
    { value: 'nif', label: 'NIF' },
    { value: 'cif', label: 'CIF' },
    { value: 'passport', label: 'Pasaporte' },
] as const;

@Injectable({ providedIn: 'root' })
export class DatosPersonaHttpService implements DatosPersonaOptionsApi {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = environment.apiPaths.autos;

    getOptions(): Observable<DatosPersonaOptions> {
        return this.http.get<ApiPaisResponse[]>(`${this.apiUrl}/catalogo/paises`).pipe(
            map((apiPaises) => ({
                documentTypes: DOCUMENT_TYPES,
                nationalities: mapToNacionalidadesDomain(apiPaises),
            })),
        );
    }
}

export function provideDatosPersonaOptionsApi(): Provider {
    return {
        provide: DATOS_PERSONA_OPTIONS_API,
        useExisting: DatosPersonaHttpService,
    };
}
