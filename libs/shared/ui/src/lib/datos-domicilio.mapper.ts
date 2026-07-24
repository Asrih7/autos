import { DatosDomicilioModel } from './address.model';
import {
  ApiTipoVia,
  ApiProvincia,
  ApiLocalidadCodigoPostal,
  ApiNormalizarDomicilioResponse,
} from './datos-domicilio.dto';

export function mapToTipoViaOptions(items: ApiTipoVia[] | null): Array<{ label: string; value: string }> {
  return (items ?? []).map((item: ApiTipoVia) => {
    const value = String(item.tvalor ?? item.nvalor ?? '').trim();
    return {
      label: value,
      value,
    };
  });
}

export function mapToProvinciaOptions(items: ApiProvincia[] | null): Array<{ label: string; value: string }> {
  return (items ?? []).map((item: ApiProvincia) => {
    const value = String(item.tdescripcion ?? item.tdescripcionC ?? item.ccodigo ?? '').trim();
    return {
      label: value,
      value,
    };
  });
}

export function mapToLocalidadOptions(items: ApiLocalidadCodigoPostal[] | null): Array<{ label: string; value: string }> {
  const options = (items ?? []).flatMap((item: ApiLocalidadCodigoPostal) =>
    [item.lpobla, item.lmunic]
      .map((value) => String(value ?? '').trim())
      .filter(Boolean)
      .map((value) => ({ label: value, value })),
  );

  return options.filter(
    (option, index) =>
      options.findIndex((candidate) => candidate.value.toLocaleLowerCase() === option.value.toLocaleLowerCase()) === index,
  );
}

export function mapProvinciaFromCodigoPostal(items: ApiLocalidadCodigoPostal[] | null): string | undefined {
  const first = (items ?? [])[0];
  return first?.lprovi ? String(first.lprovi).trim() : undefined;
}

export function mapNormalizedAddressResponse(
  response: ApiNormalizarDomicilioResponse | null,
  fallback: DatosDomicilioModel,
): DatosDomicilioModel {
  const valueOrFallback = (fallbackValue: string, ...values: unknown[]): string => {
    const value = values
      .map((candidate) => String(candidate ?? '').trim())
      .find(Boolean);
    return value || fallbackValue.trim();
  };

  return {
    // BDI puede devolver propiedades vacías tras normalizar. Nunca deben
    // borrar el valor que el usuario/Google ya había informado.
    tipoVia: valueOrFallback(fallback.tipoVia, response?.tipoVia, response?.['tipo_via']),
    nombreVia: valueOrFallback(fallback.nombreVia, response?.via, response?.['nombreVia'], response?.['nombre_via']),
    numero: valueOrFallback(fallback.numero, response?.numero),
    codigoPostal: valueOrFallback(fallback.codigoPostal, response?.codigoPostal, response?.['codigo_postal'], response?.['cpostal']).slice(0, 5),
    provincia: valueOrFallback(fallback.provincia, response?.provincia, response?.['provinciaDescripcion'], response?.['provincia_descripcion']),
    localidad: valueOrFallback(fallback.localidad, response?.localidad, response?.poblacion, response?.municipio),
  };
}
