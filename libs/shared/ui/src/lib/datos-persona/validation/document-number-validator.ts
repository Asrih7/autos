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

export interface ValidatedSearchDocument {
  readonly documentNumber: string;
  readonly documentType: DocumentType;
}

const DNI_CONTROL_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';
const CIF_CONTROL_LETTERS = 'JABCDEFGHI';
const NRT_CONTROL_LETTERS = 'ABCDEFGHJKLMNPRSTUVWXYZ';
const NRT_PATTERN = /^[FEALCUD]-\d{6}-[A-Z]$/;
const PASSPORT_PATTERN = /^[A-Z0-9]{6,9}$/;

/** Tipos de documento que el negocio da por España automáticamente. */
export const AUTO_SPAIN_DOCUMENT_TYPES: readonly DocumentType[] = ['dni', 'nif', 'cif'];

export function parseDocumentType(value: unknown): DocumentType | undefined {
  if (typeof value !== 'string') return undefined;

  const normalizedValue = value.trim().toLowerCase();
  if (normalizedValue === 'pas') return 'passport';

  return ['dni', 'nif', 'cif', 'nie', 'nrt', 'passport'].includes(normalizedValue)
    ? (normalizedValue as DocumentType)
    : undefined;
}

/**
 * TypeScript adaptation of Caser's val_documentos.js logic. It validates DNI,
 * NIF, CIF, NIE and NRT locally, including the NRT control-letter algorithm.
 */
export function validateDocumentNumber(
  documentType: DocumentType | undefined,
  documentNumber: string,
): DocumentNumberValidationError | null {
  if (!documentType) return 'documentTypeRequired';

  const value = normalizeDocumentNumber(documentNumber, documentType === 'nrt');
  if (!value) return 'required';

  switch (documentType) {
    case 'dni':
      return isValidDni(value) ? null : 'invalidDni';
    case 'nif':
      return isValidNif(value) ? null : 'invalidNif';
    case 'cif':
      return isValidCif(value) ? null : 'invalidCif';
    case 'nie':
      return isValidNie(value) ? null : 'invalidNie';
    case 'nrt':
      return isValidNrt(value) ? null : 'invalidNrt';
    case 'passport':
      return PASSPORT_PATTERN.test(value) ? null : 'invalidPassport';
  }
}

/** Validates a document typed in the client-search field and determines its type. */
export function validateSearchDocument(documentNumber: string): ValidatedSearchDocument | null {
  const normalizedNrt = normalizeDocumentNumber(documentNumber, true);
  if (isValidNrt(normalizedNrt)) {
    return { documentNumber: normalizedNrt, documentType: 'nrt' };
  }

  const value = normalizeDocumentNumber(documentNumber);
  const documentType = detectDocumentType(value);
  return validateDocumentNumber(documentType, value) === null
    ? { documentNumber: value, documentType }
    : null;
}

function normalizeDocumentNumber(value: string, preserveHyphens = false): string {
  const allowedCharacters = preserveHyphens ? /[^A-Z0-9-]/g : /[^A-Z0-9]/g;
  return value.trim().toUpperCase().replace(allowedCharacters, '');
}

function detectDocumentType(value: string): DocumentType {
  if (NRT_PATTERN.test(value)) return 'nrt';
  if (/^[XYZ]/.test(value)) return 'nie';

  if (/^\d/.test(value)) return 'nif';

  if (/^[KLM]/.test(value)) return 'nif';

  return 'cif';
}


function isValidDni(value: string): boolean {
  return /^\d{8}[A-Z]$/.test(value) && hasDniControlLetter(value.slice(0, 8), value.charAt(8));
}

function isValidNif(value: string): boolean {
  if (isValidDni(value)) return true;
  if (!/^[KLM]\d{7}[A-Z]$/.test(value)) return false;
  return hasDniControlLetter(value.slice(1, 8), value.charAt(8));
}

function isValidNie(value: string): boolean {
  if (!/^[XYZ]\d{7}[A-Z]$/.test(value)) return false;
  const prefix = { X: '0', Y: '1', Z: '2' }[value.charAt(0)];
  return hasDniControlLetter(`${prefix}${value.slice(1, 8)}`, value.charAt(8));
}

function isValidCif(value: string): boolean {
  if (!/^[ABCDEFGHJNPQRSUVW]\d{7}[A-Z0-9]$/.test(value)) return false;

  const prefix = value.charAt(0);
  const digits = value.slice(1, 8);
  const control = value.charAt(8);
  let sum = 0;

  for (let index = 0; index < digits.length; index += 1) {
    const digit = Number(digits.charAt(index));
    if (index % 2 === 0) {
      const doubled = digit * 2;
      sum += Math.floor(doubled / 10) + (doubled % 10);
    } else {
      sum += digit;
    }
  }

  const controlDigit = (10 - (sum % 10)) % 10;
  const expectedDigit = String(controlDigit);
  const expectedLetter = CIF_CONTROL_LETTERS.charAt(controlDigit);
  if ('ABEH'.includes(prefix)) return control === expectedDigit;
  if ('NPQRSW'.includes(prefix)) return control === expectedLetter;
  return control === expectedDigit || control === expectedLetter;
}

function isValidNrt(value: string): boolean {
  if (!NRT_PATTERN.test(value)) return false;

  const firstDigit = Number(value.charAt(2));
  const offset = firstDigit >= 8 ? 0 : 1;
  const calculation =
    (firstDigit + offset) * 1000 -
    Number(value.charAt(3)) * 100 +
    Number(value.charAt(4)) * 100 -
    Number(value.charAt(5)) * 10 +
    Number(value.charAt(6)) * 10 -
    Number(value.charAt(7));
  const controlIndex = ((calculation % 23) + 23) % 23;
  return value.charAt(9) === NRT_CONTROL_LETTERS.charAt(controlIndex);
}

function hasDniControlLetter(number: string, controlLetter: string): boolean {
  return DNI_CONTROL_LETTERS.charAt(Number(number) % 23) === controlLetter;
}
