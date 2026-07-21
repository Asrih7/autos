import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { DatosDomicilioModel } from './address.model';
import {
  MOCK_TIPOS_VIA,
  MOCK_PROVINCIAS,
  MOCK_LOCALIDADES_BY_CP,
  MOCK_PROVINCIA_BY_CP,
} from './mocks/datos-domicilio.mock';

@Injectable({ providedIn: 'root' })
export class DatosDomicilioService {
  getTiposVia(): Observable<{ label: string; value: string }[]> {
    return of(MOCK_TIPOS_VIA);
  }

  getProvincias(): Observable<{ label: string; value: string }[]> {
    return of(MOCK_PROVINCIAS);
  }

  getLocalidades(codigoPostal: string): Observable<{ label: string; value: string }[]> {
    if (!codigoPostal || codigoPostal.length < 5) {
      return of([]);
    }
    return of(MOCK_LOCALIDADES_BY_CP[codigoPostal] ?? []);
  }

  getProvinciaForCodigoPostal(codigoPostal: string): string | undefined {
    return MOCK_PROVINCIA_BY_CP[codigoPostal];
  }

  normalizeAddress(address: DatosDomicilioModel): Observable<DatosDomicilioModel> {
    const tipoViaIncoming = String(address.tipoVia ?? '').trim().toLowerCase();
    const matchedTipoVia = MOCK_TIPOS_VIA.find((t) => String(t.label ?? '').toLowerCase() === tipoViaIncoming || String(t.value ?? '').toLowerCase() === tipoViaIncoming);
    const tipoViaNormalized = matchedTipoVia ? matchedTipoVia.value : address.tipoVia.trim();
    const numeroNormalized = String(address.numero ?? '').replace(/[^0-9]/g, '').trim();
    const codigoPostalNormalized = String(address.codigoPostal ?? '').trim().slice(0, 5);

    return of({
      tipoVia: tipoViaNormalized,
      nombreVia: String(address.nombreVia ?? '').trim(),
      numero: numeroNormalized,
      codigoPostal: codigoPostalNormalized,
      provincia: String(address.provincia ?? '').trim(),
      localidad: String(address.localidad ?? '').trim(),
    });
  }
}
