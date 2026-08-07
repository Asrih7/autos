import type { ApiCliente, ApiDatosBusquedaCliente } from '../dto/cliente-busqueda.dto';
import type { ClienteBusquedaResult } from '../models/cliente-busqueda.model';

const getFullName = (cliente: ApiCliente): string => {
  if (cliente.razonSocial) {
    return cliente.razonSocial;
  }

  return [cliente.nombre, cliente.apell1, cliente.apell2].filter(Boolean).join(' ').trim();
};

const resolveDocumentType = (searchedDocumentType: string): string => {
  const type = String(searchedDocumentType || 'NIF').trim().toUpperCase();
  return type === 'DNI' ? 'NIF' : type;
};

const resolveNationality = (documentType: string): string =>
  ['NIF', 'CIF'].includes(documentType) ? 'ES' : '';

const parseAge = (fecNac?: string): number | undefined => {
  const birthDate = normalizeBirthDate(fecNac);
  if (!birthDate) return undefined;
  const date = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return undefined;

  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }

  return age;
};

const normalizeBirthDate = (value?: string): string | undefined => {
  if (!value) return undefined;

  const spanishDate = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (spanishDate) return `${spanishDate[3]}-${spanishDate[2]}-${spanishDate[1]}`;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString().slice(0, 10);
};

export const mapApiDatosBusquedaCliente = (
  apiResponse: ApiDatosBusquedaCliente | null,
  searchedDocumentType: string,
): ClienteBusquedaResult | null => {
  if (!apiResponse) return null;

  const cliente = apiResponse.clientes?.[0] ?? apiResponse.prospectoClientes?.[0];
  if (!cliente) return null;

  const documentType = resolveDocumentType(searchedDocumentType);

  return {
    name: getFullName(cliente),
    clientType: 'tuCliente.found.clientType',
    documentType,
    documentNumber: cliente.documento ?? '',
    nationality: resolveNationality(documentType),
    age: parseAge(cliente.fecNac),
    birthDate: normalizeBirthDate(cliente.fecNac),
    // TODO(BDI): buscarDatosCliente no devuelve domicilio del cliente. La
    // tarjeta de Figma (image6/7) sí lo muestra; pendiente de que BDI exponga
    // el dato o de encadenar otra consulta. Ver informe de revisión.
    address: undefined,
  } as ClienteBusquedaResult;
};
