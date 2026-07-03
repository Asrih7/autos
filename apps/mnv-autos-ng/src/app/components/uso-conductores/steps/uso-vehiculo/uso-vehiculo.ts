import { Component, EventEmitter, Output, signal, Signal, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BalCard, BalRadioGroup, BalRadio } from '@baloise/ds-angular';
import { UsoVehiculoService } from '../../services/uso-vehiculo.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-uso-vehiculo',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, BalCard, BalRadioGroup, BalRadio],
  templateUrl: './uso-vehiculo.html',
  styleUrl: './uso-vehiculo.scss',
})
export class UsoVehiculoComponent {
  usoSeleccionado = signal<string | null>(null);
  opciones!: Signal<{ label: string; value: string }[]>;

  @Output() selected = new EventEmitter<string>();

  constructor(private usoVehiculoService: UsoVehiculoService) {
    this.opciones = toSignal(
      this.usoVehiculoService.getUsos().pipe(catchError(() => of([]))),
      { initialValue: [] }
    );
  }

  selectUso(value: string) {
    this.usoSeleccionado.set(value);
    this.selected.emit(value);
  }
}