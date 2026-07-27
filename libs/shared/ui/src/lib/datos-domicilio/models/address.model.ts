export interface DatosDomicilioModel {
  tipoVia: string;
  nombreVia: string;
  numero: string;
  codigoPostal: string;
  provincia: string;
  localidad: string;
}

export const EMPTY_DATOS_DOMICILIO: DatosDomicilioModel = {
  tipoVia: '',
  nombreVia: '',
  numero: '',
  codigoPostal: '',
  provincia: '',
  localidad: '',
};

export function formatDireccionToString(direccion: DatosDomicilioModel): string {
  const partes: string[] = [];
  if (direccion.tipoVia) partes.push(direccion.tipoVia);
  if (direccion.nombreVia) partes.push(direccion.nombreVia);
  if (direccion.numero) partes.push(direccion.numero);
  const calle = partes.join(' ').trim();
  const codigo = direccion.codigoPostal ? direccion.codigoPostal.trim() : '';
  const ciudad = direccion.localidad ? direccion.localidad.trim() : '';

  return [calle, [codigo, ciudad].filter(Boolean).join(' ')].filter(Boolean).join(', ');
}
