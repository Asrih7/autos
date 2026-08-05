import type { DocumentType } from '../models/datos-persona.model';

export type DocumentNumberValidationError =
  | 'documentTypeRequired'
  | 'required'
  | 'invalidDni'
  | 'invalidNif'
  | 'invalidCif'
  | 'invalidNie'
  | 'invalidNrt'
  | 'invalidPassport';

const DNI_CONTROL_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';
const NIF_CONTROL_LETTERS = 'JABCDEFGHI';
const NIF_DIGIT_CONTROL_PREFIXES = 'ABEH';
const NIF_LETTER_CONTROL_PREFIXES = 'NPQRSW';
const NIF_PATTERN = /^[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J]$/;
const NIE_PATTERN = /^[XYZ]\d{7}[A-Z]$/;
const NIE_PREFIX_TO_DIGIT: Record<string, string> = { X: '0', Y: '1', Z: '2' };
// NRT (Número de Residente Temporal) no tiene un algoritmo de control público
// documentado por BDI/DGS. Hasta que se confirme el formato exacto con
// negocio/BDI (ver observación en el tracker de servicios), se valida de
// forma laxa como alfanumérico, igual que se hace hoy con el pasaporte.
const NRT_PATTERN = /^[A-Z0-9]{6,12}$/;
const PASSPORT_PATTERN = /^[A-Z0-9]{6,9}$/;

/** Tipos de documento que el negocio da por España automáticamente. */
export const AUTO_SPAIN_DOCUMENT_TYPES: readonly DocumentType[] = ['dni', 'nif', 'cif'];

export function parseDocumentType(value: unknown): DocumentType | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalizedValue = value.trim().toLowerCase();

  if (normalizedValue === 'pas') {
    return 'passport';
  }

  if (
    normalizedValue === 'dni' ||
    normalizedValue === 'nif' ||
    normalizedValue === 'cif' ||
    normalizedValue === 'nie' ||
    normalizedValue === 'nrt' ||
    normalizedValue === 'passport'
  ) {
    return normalizedValue;
  }

  return undefined;
}

export function validateDocumentNumber(
  documentType: DocumentType | undefined,
  documentNumber: string,
): DocumentNumberValidationError | null {
  const normalizedDocumentNumber = normalizeDocumentNumber(documentNumber);

  if (!documentType) {
    return 'documentTypeRequired';
  }

  if (!normalizedDocumentNumber) {
    return 'required';
  }

  switch (documentType) {
    case 'dni':
      return isValidDni(normalizedDocumentNumber) ? null : 'invalidDni';
    case 'nif':
    case 'cif':
      return isValidLegalEntityNif(normalizedDocumentNumber)
        ? null
        : documentType === 'cif'
          ? 'invalidCif'
          : 'invalidNif';
    case 'nie':
      return isValidNie(normalizedDocumentNumber) ? null : 'invalidNie';
    case 'nrt':
      return NRT_PATTERN.test(normalizedDocumentNumber) ? null : 'invalidNrt';
    case 'passport':
      return PASSPORT_PATTERN.test(normalizedDocumentNumber) ? null : 'invalidPassport';
    default:
      return null;
  }
}

function normalizeDocumentNumber(value: string): string {
  return value.trim().toUpperCase().replace(/[\s-]/g, '');
}

function isValidDni(value: string): boolean {
  if (!/^\d{8}[A-Z]$/.test(value)) {
    return false;
  }

  const numericPart = Number(value.slice(0, 8));
  const expectedLetter = DNI_CONTROL_LETTERS.charAt(numericPart % DNI_CONTROL_LETTERS.length);

  return value.charAt(8) === expectedLetter;
}

function isValidNie(value: string): boolean {
  if (!NIE_PATTERN.test(value)) {
    return false;
  }

  const numericPrefix = NIE_PREFIX_TO_DIGIT[value.charAt(0)];
  const numericPart = Number(`${numericPrefix}${value.slice(1, 8)}`);
  const expectedLetter = DNI_CONTROL_LETTERS.charAt(numericPart % DNI_CONTROL_LETTERS.length);

  return value.charAt(8) === expectedLetter;
}

function isValidLegalEntityNif(value: string): boolean {
  if (!NIF_PATTERN.test(value)) {
    return false;
  }

  const prefix = value.charAt(0);
  const digits = value.slice(1, 8);
  const providedControlCharacter = value.charAt(8);
  let checksum = 0;

  for (let index = 0; index < digits.length; index += 1) {
    const digit = Number(digits.charAt(index));

    if (index % 2 === 0) {
      const doubledDigit = digit * 2;
      checksum += Math.floor(doubledDigit / 10) + (doubledDigit % 10);
    } else {
      checksum += digit;
    }
  }

  const controlDigit = (10 - (checksum % 10)) % 10;
  const expectedDigit = String(controlDigit);
  const expectedLetter = NIF_CONTROL_LETTERS.charAt(controlDigit);

  if (NIF_DIGIT_CONTROL_PREFIXES.includes(prefix)) {
    return providedControlCharacter === expectedDigit;
  }

  if (NIF_LETTER_CONTROL_PREFIXES.includes(prefix)) {
    return providedControlCharacter === expectedLetter;
  }

  return providedControlCharacter === expectedDigit || providedControlCharacter === expectedLetter;
}
