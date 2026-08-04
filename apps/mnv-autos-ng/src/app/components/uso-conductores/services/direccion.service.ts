import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ADDRESS_SUGGESTIONS } from '../data/mock-direccion';

@Injectable({ providedIn: 'root' })
export class DireccionService {
  searchAddress(query: string): Observable<string[]> {
    const normalized = (query || '').trim().toLowerCase();

    if (!normalized) {
      return of([]);
    }

    const results = ADDRESS_SUGGESTIONS.filter(address =>
      address.toLowerCase().includes(normalized)
    ).slice(0, 8);

    return of(results);
  }
}
