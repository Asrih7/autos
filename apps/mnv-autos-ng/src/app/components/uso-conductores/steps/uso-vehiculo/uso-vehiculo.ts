import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, EventEmitter, inject, OnInit, Output, Signal, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { BalIcon, BalRadio, BalRadioGroup } from '@baloise/ds-angular';
import { TranslateModule } from '@ngx-translate/core';
import { catchError, of } from 'rxjs';

import { UsoVehiculoService } from '../../services/uso-vehiculo.service';
import { UsoConductoresStateService } from '../../uso-conductores-state.service';

@Component({
  selector: 'app-uso-vehiculo',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, BalRadio, BalRadioGroup, BalIcon, TranslateModule],
  templateUrl: './uso-vehiculo.html',
  styleUrl: './uso-vehiculo.scss',
})
export class UsoVehiculoComponent implements OnInit {
  private readonly state = inject(UsoConductoresStateService);

  usoSeleccionado = signal<string | null>(null);
  otroUsoSeleccionado = signal<string | null>(null);
  expandedOption = signal<string | null>(null);

  opciones!: Signal<{ label: string; value: string }[]>;
  otrosUsos!: Signal<{ label: string; value: string }[]>;

  @Output() selected = new EventEmitter<string>();

  constructor(private readonly usoVehiculoService: UsoVehiculoService) {
    this.opciones = toSignal(this.usoVehiculoService.getUsos().pipe(catchError(() => of([]))), {
      initialValue: [],
    });
    this.otrosUsos = toSignal(this.usoVehiculoService.getOtrosUsos().pipe(catchError(() => of([]))), {
      initialValue: [],
    });
  }

  ngOnInit(): void {
    const savedState = this.state.state();
    if (savedState) {
      this.usoSeleccionado.set(savedState.usoSelected);
      this.otroUsoSeleccionado.set(savedState.usoOtrosSelected);
      this.expandedOption.set(null);
    }
  }

  onUsoChange(value: string | number | boolean): void {
    const stringValue = String(value);
    if (stringValue === this.usoSeleccionado()) {
      return;
    }

    this.selectUso(stringValue);
  }

  selectUso(value: string): void {
    if (!value) {
      return;
    }

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
    if (!value) {
      return;
    }

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
    if (option.value !== 'otros') {
      return option.label;
    }

    const selected = this.otroUsoSeleccionado();
    if (!selected) {
      return option.label;
    }

    return this.otrosUsos().find(opt => opt.value === selected)?.label ?? option.label;
  }
}