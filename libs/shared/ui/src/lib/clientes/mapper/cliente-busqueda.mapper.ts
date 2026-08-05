import type { ApiCliente, ApiDatosBusquedaCliente } from '../dto/cliente-busqueda.dto';
import type { ClienteBusquedaResult } from '../models/cliente-busqueda.model';

const getFullName = (cliente: ApiCliente): string => {
  if (cliente.razonSocial) {
    return cliente.razonSocial;
  }

  return [cliente.nombre, cliente.apell1, cliente.apell2].filter(Boolean).join(' ').trim();
};

// FIX: `tipoPersona` en la respuesta de BDI/buscarDatosCliente es F (física) /
// J (jurídica), NUNCA el tipo de documento (NIF/CIF/NIE/NRT). Antes esta
// función comparaba 'F'/'J' contra ['NIF','CIF','NIE'], por lo que nunca
// coincidía y el resultado siempre caía en 'DNI', sea cual sea el documento
// real buscado. El tipo de documento correcto es el que ya detectamos al
// normalizar la búsqueda (ver detectDocumentType en el servicio), así que se
// recibe aquí como parámetro en lugar de inventarlo a partir de tipoPersona.
const resolveDocumentType = (searchedDocumentType: string): string => {
  const type = String(searchedDocumentType || 'NIF').trim().toUpperCase();
  return type === 'DNI' ? 'NIF' : type;
};

// España solo se puede asumir automáticamente para documentos nacionales
// (DNI/NIF/CIF). Para NIE/NRT no tenemos country de BDI en este endpoint
// (ver observación de datos pendientes en el informe), así que se deja sin
// resolver y el agente debe confirmarla en el paso de "Editar".
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
    clientType: 'Cliente encontrado',
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
