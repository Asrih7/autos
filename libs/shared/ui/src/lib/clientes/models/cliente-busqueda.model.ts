export interface ClienteBusquedaRequest {
  readonly documento: string;
}

export interface ClienteBusquedaResult {
  readonly name: string;
  readonly clientType: string;
  readonly documentType: string;
  readonly documentNumber: string;
  readonly nationality: string;
  readonly age?: number;
  readonly birthDate?: string;
  readonly address?: string;
}
