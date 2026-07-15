import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { DatosDomicilioModel } from './address.model';

const TIPOS_VIA = [
  { label: 'Calle', value: 'Calle' },
  { label: 'Avenida', value: 'Avenida' },
  { label: 'Plaza', value: 'Plaza' },
  { label: 'Camino', value: 'Camino' },
  { label: 'Paseo', value: 'Paseo' },
];

const PROVINCIAS = [
  { label: 'Madrid', value: 'Madrid' },
  { label: 'Barcelona', value: 'Barcelona' },
  { label: 'Sevilla', value: 'Sevilla' },
  { label: 'Valencia', value: 'Valencia' },
  { label: 'Zaragoza', value: 'Zaragoza' },
];

const LOCALIDADES_BY_CP: Record<string, { label: string; value: string }[]> = {
  '28013': [
    { label: 'Madrid', value: 'Madrid' },
  ],
  '28008': [
    { label: 'Madrid', value: 'Madrid' },
  ],
  '28014': [
    { label: 'Madrid', value: 'Madrid' },
  ],
  '41001': [
    { label: 'Sevilla', value: 'Sevilla' },
  ],
};

const PROVINCIA_BY_CP: Record<string, string> = {
  '28013': 'Madrid',
  '28008': 'Madrid',
  '28014': 'Madrid',
  '41001': 'Sevilla',
};

@Injectable({ providedIn: 'root' })
export class DatosDomicilioService {
  getTiposVia(): Observable<{ label: string; value: string }[]> {
    return of(TIPOS_VIA);
  }

  getProvincias(): Observable<{ label: string; value: string }[]> {
    return of(PROVINCIAS);
  }

  getLocalidades(codigoPostal: string): Observable<{ label: string; value: string }[]> {
    if (!codigoPostal || codigoPostal.length < 5) {
      return of([]);
    }
    return of(LOCALIDADES_BY_CP[codigoPostal] ?? []);
  }

  getProvinciaForCodigoPostal(codigoPostal: string): string | undefined {
    return PROVINCIA_BY_CP[codigoPostal];
  }

  normalizeAddress(address: DatosDomicilioModel): Observable<DatosDomicilioModel> {
    return of({
      tipoVia: address.tipoVia.trim(),
      nombreVia: address.nombreVia.trim(),
      numero: address.numero.trim(),
      codigoPostal: address.codigoPostal.trim().slice(0, 5),
      provincia: address.provincia.trim(),
      localidad: address.localidad.trim(),
    });
  }
}
