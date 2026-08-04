import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { DRIVING_LICENSE_TYPES, MAX_OCCASIONAL_DRIVERS } from '../data/mock-sisnet';

@Injectable({ providedIn: 'root' })
export class SisnetService {
  getDrivingLicenseTypes(): Observable<{ label: string; value: string }[]> {
    return of(DRIVING_LICENSE_TYPES);
  }

  getNumberOfOccasionalDrivers(): Observable<number> {
    return of(MAX_OCCASIONAL_DRIVERS);
  }
}
