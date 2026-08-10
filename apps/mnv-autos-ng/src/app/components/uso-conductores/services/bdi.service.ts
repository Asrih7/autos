import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { DOCUMENT_TYPES, COUNTRIES } from '../data/mock-bdi';

@Injectable({ providedIn: 'root' })
export class BdiService {
  getDocumentTypes(): Observable<{ label: string; value: string }[]> {
    return of(DOCUMENT_TYPES);
  }

  getCountries(): Observable<{ label: string; value: string }[]> {
    return of(COUNTRIES);
  }
}
