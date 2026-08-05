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
const resolveDocumentType = (searchedDocumentType: string): string =>
  String(searchedDocumentType || 'DNI').trim().toUpperCase();

// España solo se puede asumir automáticamente para documentos nacionales
// (DNI/NIF/CIF). Para NIE/NRT no tenemos country de BDI en este endpoint
// (ver observación de datos pendientes en el informe), así que se deja sin
// resolver y el agente debe confirmarla en el paso de "Editar".
const resolveNationality = (documentType: string): string =>
  ['DNI', 'NIF', 'CIF'].includes(documentType) ? 'Española' : '';

const parseAge = (fecNac?: string): number | undefined => {
  if (!fecNac) return undefined;
  const date = new Date(fecNac);
  if (Number.isNaN(date.getTime())) return undefined;

  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }

  return age;
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
    // TODO(BDI): buscarDatosCliente no devuelve domicilio del cliente. La
    // tarjeta de Figma (image6/7) sí lo muestra; pendiente de que BDI exponga
    // el dato o de encadenar otra consulta. Ver informe de revisión.
    address: undefined,
  };
};
