import type { DatosPersonaOption } from './datos-persona-options.api';
import type { ApiPaisResponse } from './datos-persona.dto';

export function mapToNacionalidadesDomain(
    apiPaises: readonly ApiPaisResponse[],
): readonly DatosPersonaOption[] {
    return apiPaises.map(({ codigo, descripcion }) => ({
        value: codigo,
        label: descripcion,
    }));
}
