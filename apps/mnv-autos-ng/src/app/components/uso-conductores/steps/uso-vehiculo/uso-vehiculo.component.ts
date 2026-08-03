import { CommonModule } from '@angular/common';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  EventEmitter,
  inject,
  OnInit,
  Output,
  Signal,
  computed,
  ChangeDetectorRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { BalRadio, BalRadioGroup, BalDropdown, BalOption } from '@baloise/ds-angular';
import { TranslateModule } from '@ngx-translate/core';
import { catchError, of } from 'rxjs';

import { UsoVehiculoService } from '../../services/uso-vehiculo.service';
import { UsoConductoresStateService } from '../../uso-conductores-state.service';

@Component({
  selector: 'app-uso-vehiculo',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,
    BalRadio,
    BalRadioGroup,
    BalDropdown,
    BalOption,
    TranslateModule,
  ],
  templateUrl: './uso-vehiculo.component.html',
  styleUrls: ['./uso-vehiculo.component.scss'],
})
export class UsoVehiculoComponent implements OnInit {
  private readonly state = inject(UsoConductoresStateService);
  private readonly cdr = inject(ChangeDetectorRef);

  opciones!: Signal<{ label: string; value: string }[]>;
  otrosUsos!: Signal<{ label: string; value: string }[]>;

  @Output() stepSelected = new EventEmitter<string>();
  @Output() selected = new EventEmitter<string>();
  @Output() ready = new EventEmitter<boolean>();

 
  usoSeleccionado = computed(() => this.state.usoSelected());
  otroUsoSeleccionado = computed(() => this.state.usoOtrosSelected());
  otroUsoLabelSeleccionado = computed(() => {
    const value = this.otroUsoSeleccionado();
    if (!value) return null;
    const found = this.otrosUsos().find((opt) => opt.value === value);
    return found ? found.label : null;
  });

  otherLabel = computed(() => {
    if (this.usoSeleccionado() !== 'otros') return null;
    return this.otroUsoLabelSeleccionado();
  });

  constructor(private readonly usoVehiculoService: UsoVehiculoService) {
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
    this.stepSelected.emit('uso-vehiculo');
    this.ready.emit(!this.isNextDisabled());
  }

  onUsoChange(value: string | number | boolean): void {
    const stringValue = String(value);
    if (stringValue === this.usoSeleccionado()) return;
    this.selectUso(stringValue);
  }

  selectUso(value: string): void {
    if (!value) return;

    this.state.selectUso(value);
    this.selected.emit(value);

    if (value === 'otros') {
      this.ready.emit(true);
    } else {
      this.state.selectUsoOtro(null as any);
      this.ready.emit(true);
    }
  }

  onRowClick(opcion: { label: string; value: string }, dropdownRef?: any): void {
    this.selectUso(opcion.value);

    if (opcion.value === 'otros' && dropdownRef?.open) {
      setTimeout(() => dropdownRef.open(), 0);
    }
  }

  onOtroUsoOptionChange(event: any): void {
    const option = event?.detail;
    if (!option || !option.selected) return;

    const finalValue = String(option.value);

    this.state.selectUsoOtro(finalValue);
    this.state.selectUso('otros');

    this.selected.emit(finalValue);
    this.ready.emit(true);

    this.cdr.detectChanges();
  }

  isNextDisabled(): boolean {
    const uso = this.usoSeleccionado();
    if (!uso) return true;
    if (uso === 'otros' && !this.otroUsoSeleccionado()) return true;
    return false;
  }

  getOtroUsoLabel(option: { label: string; value: string }): string {
    if (option.value !== 'otros') {
      return option.label;
    }
    return this.otroUsoLabelSeleccionado() ?? option.label;
  }
}
