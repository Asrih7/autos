import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UsoConductoresStateService {
  private usoSelectedSource = new Subject<string>();
  usoSelected$ = this.usoSelectedSource.asObservable();
  selectUso(value: string) {
    this.usoSelectedSource.next(value);
  }

  private intervinientesCompletedSource = new Subject<void>();
  intervinientesCompleted$ = this.intervinientesCompletedSource.asObservable();
  completeIntervinientes() {
    this.intervinientesCompletedSource.next();
  }
}