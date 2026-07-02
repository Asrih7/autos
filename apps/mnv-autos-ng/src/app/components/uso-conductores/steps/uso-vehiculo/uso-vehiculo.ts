import {
  Component,
  OnInit,
  signal,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// BAL UI
import {
  BalCard,
  BalRadio,
  BalIcon,
} from '@baloise/ds-angular';

import { UsoVehiculoService } from '../../services/uso-vehiculo.service';
import { UsoVehiculo } from '../../models/uso-vehiculo.model';

@Component({
  selector: 'app-uso-vehiculo',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,

    // BAL UI
    BalCard,
    BalRadio,
    BalIcon,
  ],
  templateUrl: './uso-vehiculo.html',
  styleUrl: './uso-vehiculo.scss',
})
export class UsoVehiculoComponent implements OnInit {
  readonly usoSeleccionado = signal<string>('personal-familiar');
  readonly otroUsoSeleccionado = signal<string | null>(null);

  opciones = toSignal(
    this.usoVehiculoService.getUsos().pipe(
      tap((usos) => {
        const premarcado = usos.find((o) => o.premarcado)?.value;
        this.usoSeleccionado.set(premarcado ?? 'personal-familiar');
      }),
      catchError(() => of([]))
    ),
    { initialValue: [] }
  );

  otrosUsos = toSignal(
    this.usoVehiculoService.getOtrosUsos().pipe(
      catchError(() => of([]))
    ),
    { initialValue: [] }
  );

  selectedOtherLabel = computed(() => {
    const selected = this.otroUsoSeleccionado();
    return selected
      ? this.otrosUsos().find((o) => o.value === selected)?.label ?? ''
      : '';
  });

  constructor(
    private usoVehiculoService: UsoVehiculoService
  ) {}

  ngOnInit() {}

  selectUso(value: string) {
    this.usoSeleccionado.set(value);

    if (value !== 'otros') {
      this.otroUsoSeleccionado.set(null);
    }
  }

  onSelectSubUso(value: string) {
    this.otroUsoSeleccionado.set(value);
    this.usoSeleccionado.set(value);
  }

}
