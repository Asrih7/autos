import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { BalSelect, BalSelectOption } from '@baloise/ds-angular';
import { Subject, of, startWith } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import { DireccionModel } from '../../../../models/direccion.model';
import { DireccionService } from '../../../../services/direccion.service';

@Component({
  selector: 'app-direccion-tomador',
  standalone: true,
  imports: [CommonModule, FormsModule, BalSelect, BalSelectOption],
  templateUrl: './direccion-tomador.component.html',
  styleUrls: ['./direccion-tomador.component.scss'],
})
export class DireccionTomadorComponent implements OnInit {
  @Input() initial: Partial<DireccionModel> | null = null;
  @Output() save = new EventEmitter<DireccionModel>();
  @Output() direccionCompleted = new EventEmitter<void>();

  model = signal<DireccionModel>({ domicilio: '' });

  private readonly query$ = new Subject<string>();

  suggestions = toSignal(
    this.query$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap((query: string) =>
        query
          ? this.direccionService.searchAddress(query).pipe(catchError(() => of([])))
          : of([])
      ),
      startWith<string[]>([])
    )
  );

  constructor(private readonly direccionService: DireccionService) {}

  ngOnInit(): void {
    if (this.initial?.domicilio) {
      this.model.set({ domicilio: this.initial.domicilio });
      this.query$.next(this.initial.domicilio);
    }
  }

  searchQueryChanged(query: string): void {
    this.query$.next((query || '').toString().trim());
  }

  onSelectChange(event: any): void {
    const value = event?.detail ?? event?.detail?.value ?? event?.target?.value ?? null;
    const domicilio = typeof value === 'object' && 'value' in value ? value.value : value;
    this.model.set({ ...this.model(), domicilio });

    if (domicilio && domicilio.toString().trim().length >= 3) {
      this.save.emit({ domicilio });
      this.direccionCompleted.emit();
    }
  }

  onSave(): void {
    const domicilio = (this.model().domicilio || '').trim();
    if (!domicilio || domicilio.length < 3) {
      return;
    }

    this.save.emit({ domicilio });
  }

  saveDireccion(): void {
    this.direccionCompleted.emit();
  }
}
