// apps/mnv-autos-ng/src/app/components/uso-conductores/steps/intervinientes/components/direccion-tomador/direccion-tomador.component.ts
import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BalSelect, BalSelectOption, BalButton } from '@baloise/ds-angular';
import { Observable, Subject, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import { DireccionModel } from '../../../../models/direccion.model';
import { DireccionService } from '../../../services/direccion.service';

@Component({
  selector: 'app-direccion-tomador',
  standalone: true,
  imports: [CommonModule, FormsModule, BalSelect, BalSelectOption, BalButton],
  templateUrl: './direccion-tomador.component.html',
  styleUrls: ['./direccion-tomador.component.scss'],
})
export class DireccionTomadorComponent implements OnInit {
  @Input() initial: Partial<DireccionModel> | null = null;
  @Output() save = new EventEmitter<DireccionModel>();

  model = signal<DireccionModel>({ domicilio: '' });
  private readonly query$ = new Subject<string>();
  suggestions$: Observable<string[]> = this.query$.pipe(
    debounceTime(200),
    distinctUntilChanged(),
    switchMap((query: string) =>
      query ? this.direccionService.searchAddress(query).pipe(catchError(() => of([]))) : of([])
    )
  );

  constructor(private direccionService: DireccionService) {}

  ngOnInit() {
    if (this.initial?.domicilio) {
      this.model.set({ domicilio: this.initial.domicilio! });
      this.query$.next(this.initial.domicilio);
    }
  }

  searchQueryChanged(q: string) {
    this.query$.next((q || '').toString().trim());
  }

  onSelectChange(event: any) {
    const v = event?.detail ?? event?.detail?.value ?? event?.target?.value ?? null;
    const domicilio = typeof v === 'object' && 'value' in v ? v.value : v;
    this.model.set({ ...this.model(), domicilio });
  }

  onSave() {
    const domicilio = (this.model().domicilio || '').trim();
    if (!domicilio || domicilio.length < 3) return;
    this.save.emit({ domicilio });
  }
}
