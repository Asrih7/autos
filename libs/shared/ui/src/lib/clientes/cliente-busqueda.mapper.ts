import type { ApiCliente, ApiDatosBusquedaCliente } from './cliente-busqueda.dto';
import type { ClienteBusquedaResult } from './cliente-busqueda.model';

const getFullName = (cliente: ApiCliente): string => {
  if (cliente.razonSocial) {
    return cliente.razonSocial;
  }

  return [cliente.nombre, cliente.apell1, cliente.apell2].filter(Boolean).join(' ').trim();
};

const mapDocumentType = (tipoPersona?: string): string => {
  const normalized = String(tipoPersona ?? '').trim().toUpperCase();
  if (['NIF', 'CIF', 'NIE'].includes(normalized)) {
    return normalized;
  }
  return 'DNI';
};

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
): ClienteBusquedaResult | null => {
  if (!apiResponse) return null;

  const cliente = apiResponse.clientes?.[0] ?? apiResponse.prospectoClientes?.[0];
  if (!cliente) return null;

  return {
    name: getFullName(cliente),
    clientType: 'Cliente encontrado',
    documentType: mapDocumentType(cliente.tipoPersona),
    documentNumber: cliente.documento ?? '',
    nationality: 'Española',
    age: parseAge(cliente.fecNac),
    address: undefined,
  };
};
