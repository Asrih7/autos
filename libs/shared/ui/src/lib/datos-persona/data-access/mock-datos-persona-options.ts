import type { DatosPersonaOption } from './datos-persona-options.model';

export const DOCUMENT_TYPES: readonly DatosPersonaOption[] = [
  { label: 'NIF', value: 'NIF' },
  { label: 'CIF', value: 'CIF' },
  { label: 'NIE', value: 'NIE' },
  { label: 'Pasaporte', value: 'PAS' },
];
