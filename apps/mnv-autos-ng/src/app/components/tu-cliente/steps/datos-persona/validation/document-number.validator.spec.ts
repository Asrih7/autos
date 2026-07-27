import { parseDocumentType, validateDocumentNumber } from './document-number.validator';

describe('document number validator', () => {
  it('should validate a DNI using its control letter', () => {
    expect(validateDocumentNumber('dni', '12345678Z')).toBeNull();
    expect(validateDocumentNumber('dni', '12345678A')).toBe('invalidDni');
  });

  it('should validate a legal entity NIF using its control character', () => {
    expect(validateDocumentNumber('nif', 'A58818501')).toBeNull();
    expect(validateDocumentNumber('nif', 'P2807900B')).toBeNull();
    expect(validateDocumentNumber('nif', 'A58818500')).toBe('invalidNif');
    expect(validateDocumentNumber('nif', 'P28079002')).toBe('invalidNif');
  });

  it('should validate a CIF using its control character', () => {
    expect(validateDocumentNumber('cif', 'A58818501')).toBeNull();
    expect(validateDocumentNumber('cif', 'P2807900B')).toBeNull();
    expect(validateDocumentNumber('cif', 'A58818500')).toBe('invalidCif');
  });

  it('should validate the passport structure', () => {
    expect(validateDocumentNumber('passport', 'PA123456')).toBeNull();
    expect(validateDocumentNumber('passport', 'A12')).toBe('invalidPassport');
    expect(validateDocumentNumber('passport', 'AB1234567890')).toBe('invalidPassport');
  });

  it('should require a value and a supported document type', () => {
    expect(validateDocumentNumber('dni', '')).toBe('required');
    expect(validateDocumentNumber(undefined, '12345678Z')).toBe('documentTypeRequired');
    expect(parseDocumentType('NIF')).toBe('nif');
    expect(parseDocumentType('CIF')).toBe('cif');
    expect(parseDocumentType('unsupported')).toBeUndefined();
  });
});
