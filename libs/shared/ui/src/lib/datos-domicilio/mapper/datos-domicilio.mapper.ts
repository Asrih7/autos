import { DatosDomicilioModel } from "../models/address.model";
import {
  ApiTipoVia,
  ApiProvincia,
  ApiLocalidadCodigoPostal,
  ApiNormalizarDomicilioResponse,
} from './../dto/datos-domicilio.dto';

export function mapToTipoViaOptions(items: ApiTipoVia[] | null): Array<{ label: string; value: string }> {
  return (items ?? [])
    .map((item: ApiTipoVia) => {
      // The documented contract does not identify nvalor as a code or tvalor
      // as a denomination. Do not invent that mapping: preserve tvalor, the
      // only textual value, until backend confirms the catalog semantics.
      const value = String(item.tvalor ?? '').trim();
      return {
        label: value,
        value,
      };
    })
    .filter((item) => Boolean(item.value));
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

/**
 * BDI responde 200 / error:0 incluso cuando NO ha podido reconocer la vía
 * introducida (p.ej. "TEST" como número/nombre de vía). En ese caso devuelve
 * `codigoVia` y `tipoVia` vacíos, y `mensajeIndicadorCalidad` indica
 * explícitamente "Vía... No codificados".
 *
 * `codigoVia` es la señal más fiable porque es un campo estructurado (código
 * oficial de callejero), no depende de parsear el texto de
 * `mensajeIndicadorCalidad` (que podría cambiar de redacción).
 *
 * Una dirección con `codigoVia` vacío se considera NO resuelta con fiabilidad
 * suficiente, tanto si se introdujo a mano como si vino de la selección de
 * Google (en ese caso también es correcto avisar: significa que la calle que
 * Google devolvió no está en el callejero oficial de BDI).
 */
export function isDireccionNormalizadaFiable(response: ApiNormalizarDomicilioResponse | null): boolean {
  if (!response) return false;
  const codigoViaResuelto = String(response.codigoVia ?? '').trim();
  return codigoViaResuelto.length > 0;
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