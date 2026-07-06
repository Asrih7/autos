import { Component, EventEmitter, OnInit, Output, signal, Signal, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BalRadio, BalRadioGroup, BalIcon } from '@baloise/ds-angular';
import { UsoVehiculoService } from '../../services/uso-vehiculo.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { UsoConductoresStateService } from '../../uso-conductores-state.service';

@Component({
  selector: 'app-uso-vehiculo',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, BalRadio, BalRadioGroup, BalIcon],
  templateUrl: './uso-vehiculo.html',
  styleUrl: './uso-vehiculo.scss',
})
export class UsoVehiculoComponent implements OnInit {
  private state = inject(UsoConductoresStateService);

  usoSeleccionado = signal<string | null>(null);
  otroUsoSeleccionado = signal<string | null>(null);
  expandedOption = signal<string | null>(null);

  opciones!: Signal<{ label: string; value: string }[]>;
  otrosUsos!: Signal<{ label: string; value: string }[]>;

  @Output() selected = new EventEmitter<string>();

  constructor(private usoVehiculoService: UsoVehiculoService) {
    this.opciones = toSignal(
      this.usoVehiculoService.getUsos().pipe(catchError(() => of([]))),
      { initialValue: [] }
    );
    this.otrosUsos = toSignal(
      this.usoVehiculoService.getOtrosUsos().pipe(catchError(() => of([]))),
      { initialValue: [] }
    );
  }

  ngOnInit(): void {
    // el service ya es 100% síncrono (signal + sessionStorage cargado en el constructor),
    // así que podemos leer el estado guardado directamente, sin necesidad de "esperar" nada
    const savedState = this.state.state();
    if (savedState) {
      this.usoSeleccionado.set(savedState.usoSelected);
      this.otroUsoSeleccionado.set(savedState.usoOtrosSelected);
      // si ya había un sub-uso de "otros" elegido, dejamos el dropdown cerrado
      // (el label ya muestra el sub-uso elegido vía getOtroUsoLabel)
      this.expandedOption.set(null);
    }
  }

  /**
   * Disparado por el evento nativo del bal-radio-group cuando el usuario
   * clickea directamente sobre un bal-radio (no sobre el card).
   */
onUsoChange(value: string | number | boolean): void {
  const stringValue = String(value);
  if (stringValue === this.usoSeleccionado()) return;
  this.selectUso(stringValue);
}

  /**
   * Click en cualquier parte del card (header completo).
   */
  selectUso(value: string): void {
    if (!value) return;

    const yaEstabaSeleccionado = this.usoSeleccionado() === value;
    this.usoSeleccionado.set(value);

    if (value === 'otros') {
      if (!yaEstabaSeleccionado) {
        this.expandedOption.set('otros');
      }
    } else {
      this.expandedOption.set(null);
      this.otroUsoSeleccionado.set(null);
      this.state.selectUsoOtro(null as any);
    }

    this.state.selectUso(value);
    this.selected.emit(value);
  }

  selectOtroUso(value: string): void {
    if (!value) return;

    this.usoSeleccionado.set('otros');
    this.state.selectUso('otros');

    this.otroUsoSeleccionado.set(value);
    this.state.selectUsoOtro(value);

    this.expandedOption.set(null);
  }

  toggleExpand(optionValue: string): void {
    this.expandedOption.update(current => (current === optionValue ? null : optionValue));
  }

  isExpanded(optionValue: string): boolean {
    return this.expandedOption() === optionValue;
  }

  getOtroUsoLabel(option: { label: string; value: string }): string {
    if (option.value !== 'otros') return option.label;
    const selected = this.otroUsoSeleccionado();
    if (!selected) return option.label;
    return this.otrosUsos().find(opt => opt.value === selected)?.label ?? option.label;
  }
}