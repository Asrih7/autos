import { Component, Output, EventEmitter, inject, computed, signal } from '@angular/core';
import { UsoConductoresStateService } from '../../uso-conductores-state.service';

import {
  BalField,
  BalFieldControl,
  BalFieldMessage,
  BalDate,
  BalHeading,
} from '@baloise/ds-angular';

import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-fecha-efecto-seguro',
  standalone: true,
  imports: [
    BalField,
    BalFieldControl,
    BalFieldMessage,
    BalDate,
    BalHeading,
    TranslateModule
  ],
  templateUrl: './fecha-efecto-seguro.component.html',
  styleUrls: ['./fecha-efecto-seguro.component.scss'],
})
export class FechaEfectoSeguroComponent {

  @Output() stepSelected = new EventEmitter<string>();
  private touched = signal(false);
  private readonly usoState = inject(UsoConductoresStateService);

  // Fecha ISO guardada en el estado
  readonly fechaISO = computed(() => this.usoState.fechaEfectoSeguro().fechaISO);

  // Error visible en el template
  fechaEfectoError() {
  const state = this.usoState.fechaEfectoSeguro();

  // Igual que intervinientes: solo mostrar error si el usuario ha tocado el campo
  if (this.touched() && (!state.fechaISO || !state.completed)) {
    return 'Introduce una fecha válida';
  }

  return null;
}


  ngOnInit(): void {
    this.stepSelected.emit('fecha-efecto-seguro');
    this.setDefaultDateIfEmpty();
  }

  private setDefaultDateIfEmpty(): void {
    // La fecha de efecto se establece siempre al día local actual; no se
    // reutiliza una fecha persistida de una simulación anterior.
    const today = new Date();
    const iso = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0'),
    ].join('-');
    const [anio, mes, dia] = iso.split('-');

    this.usoState.updateFechaEfectoSeguroState({
      fechaISO: iso,
      dia,
      mes,
      anio,
      completed: true
    });
  }

  /**
   * Maneja el cambio del bal-date
   */
  onFechaEfectoChange(event: any): void {
  this.touched.set(true);

  const iso = event?.detail ?? null;

  if (!iso) {
    this.usoState.updateFechaEfectoSeguroState({
      fechaISO: null,
      dia: '',
      mes: '',
      anio: '',
      completed: false
    });
    return;
  }

  const [anio, mes, dia] = iso.split('-');

  this.usoState.updateFechaEfectoSeguroState({
    fechaISO: iso,
    dia,
    mes,
    anio,
    completed: true
  });
}

}
