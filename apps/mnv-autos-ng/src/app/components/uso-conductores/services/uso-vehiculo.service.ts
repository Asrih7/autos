import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { USOS_VEHICULO, OTROS_USOS } from '../data/mock-uso-vehiculo';

@Injectable({ providedIn: 'root' })
export class UsoVehiculoService {
  getUsos(): Observable<{ label: string; value: string; premarcado?: boolean }[]> {
    return of(USOS_VEHICULO);
  }

  getOtrosUsos(): Observable<{ label: string; value: string }[]> {
    return of(OTROS_USOS);
  }
}
