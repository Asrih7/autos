export type DocumentType = 'dni' | 'nif' | 'cif' | 'nie' | 'nrt' | 'passport';

export interface DatosPersonaModel {
  documentType?: DocumentType;
  documentNumber: string;
  nationality?: string;
  firstName: string;
  firstSurname: string;
  secondSurname: string;
  businessName: string;
  sameBeneficiary: boolean;
}
