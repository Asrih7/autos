import { DatosDomicilioModel } from '../address.model';

export const MOCK_TIPOS_VIA = [
  { label: 'Calle', value: 'Calle' },
  { label: 'Avenida', value: 'Avenida' },
  { label: 'Plaza', value: 'Plaza' },
  { label: 'Camino', value: 'Camino' },
  { label: 'Paseo', value: 'Paseo' },
];

export const MOCK_PROVINCIAS = [
  { label: 'Madrid', value: 'Madrid' },
  { label: 'Barcelona', value: 'Barcelona' },
  { label: 'Sevilla', value: 'Sevilla' },
  { label: 'Valencia', value: 'Valencia' },
  { label: 'Zaragoza', value: 'Zaragoza' },
];

export const MOCK_LOCALIDADES_BY_CP: Record<string, { label: string; value: string }[]> = {
  '28013': [{ label: 'Madrid', value: 'Madrid' }],
  '28008': [{ label: 'Madrid', value: 'Madrid' }],
  '28014': [{ label: 'Madrid', value: 'Madrid' }],
  '41001': [{ label: 'Sevilla', value: 'Sevilla' }],
};

export const MOCK_PROVINCIA_BY_CP: Record<string, string> = {
  '28013': 'Madrid',
  '28008': 'Madrid',
  '28014': 'Madrid',
  '41001': 'Sevilla',
};

export const MOCK_GOOGLE_SUGGESTIONS = [
  'Calle Mayor 1, 28013 Madrid',
  'Avenida de la Constitución 12, 28014 Madrid',
  'Plaza España 5, 28008 Madrid',
  'Calle del Laurel 14, 28006 Logroño',
  'Calle Sierpes 8, 41002 Sevilla',
];

export const MOCK_NORMALIZED: DatosDomicilioModel = {
  tipoVia: 'Calle',
  nombreVia: 'Mayor',
  numero: '1',
  codigoPostal: '28013',
  provincia: 'Madrid',
  localidad: 'Madrid',
};
