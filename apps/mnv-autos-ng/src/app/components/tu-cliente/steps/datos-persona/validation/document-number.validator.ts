export type DocumentType = 'dni' | 'nif' | 'cif' | 'passport';

export type DocumentNumberValidationError =
  | 'documentTypeRequired'
  | 'required'
  | 'invalidDni'
  | 'invalidNif'
  | 'invalidCif'
  | 'invalidPassport';

const DNI_CONTROL_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';
const NIF_CONTROL_LETTERS = 'JABCDEFGHI';
const NIF_DIGIT_CONTROL_PREFIXES = 'ABEH';
const NIF_LETTER_CONTROL_PREFIXES = 'NPQRSW';
const NIF_PATTERN = /^[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J]$/;
const PASSPORT_PATTERN = /^[A-Z0-9]{6,9}$/;

export function parseDocumentType(value: unknown): DocumentType | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalizedValue = value.trim().toLowerCase();

  if (
    normalizedValue === 'dni' ||
    normalizedValue === 'nif' ||
    normalizedValue === 'cif' ||
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

  if (!normalizedDocumentNumber) {
    return 'required';
  }

  if (!documentType) {
    return 'documentTypeRequired';
  }

  switch (documentType) {
    case 'dni':
      return isValidDni(normalizedDocumentNumber) ? null : 'invalidDni';
    case 'nif':
      return isValidLegalEntityNif(normalizedDocumentNumber) ? null : 'invalidNif';
    case 'cif':
      return isValidLegalEntityNif(normalizedDocumentNumber) ? null : 'invalidCif';
    case 'passport':
      return PASSPORT_PATTERN.test(normalizedDocumentNumber) ? null : 'invalidPassport';
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
