import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BalAlert, BalHeading } from '@baloise/ds-angular';
import { TranslateModule } from '@ngx-translate/core';
import { DireccionModel } from '../../models/direccion.model';
import { UsoConductoresStateService } from '../../uso-conductores-state.service';
import {
  DatosDomicilioForm,
  DatosDomicilioGoogle,
  DatosDomicilioModel,
  DatosDomicilioService,
  formatDireccionToString,
  EMPTY_DATOS_DOMICILIO,
} from '@mnv-autos-ng/shared/ui';

@Component({
  selector: 'app-direccion-tomador',
  standalone: true,
  imports: [CommonModule, FormsModule, BalAlert, BalHeading, TranslateModule, DatosDomicilioGoogle, DatosDomicilioForm],
  templateUrl: './direccion-tomador.component.html',
  styleUrls: ['./direccion-tomador.component.scss'],
})
export class DireccionTomadorComponent implements OnInit {
  @Input() initial: Partial<DireccionModel> | null = null;
  @Output() save = new EventEmitter<DireccionModel>();
  @Output() direccionCompleted = new EventEmitter<void>();
  @Output() stepSelected = new EventEmitter<string>();

  model = signal<DireccionModel>({ domicilio: '' });
  direccion = signal<DatosDomicilioModel>({ ...EMPTY_DATOS_DOMICILIO });
  formDisabled = signal(false);
  normalized = signal(false);
  avisoTexto = signal('');

  private readonly usoState = inject(UsoConductoresStateService);
  private readonly datosService = inject(DatosDomicilioService);

  ngOnInit(): void {
    this.stepSelected.emit('direccion-tomador');
    if (this.initial?.domicilio) {
      this.model.set({ domicilio: this.initial.domicilio });
    }
  }

  onAddressSelected(address: DatosDomicilioModel): void {
    this.direccion.set(address);
    this.formDisabled.set(true);
    this.normalized.set(false);
    this.avisoTexto.set('Los datos de dirección han sido cargados desde Google y se bloquearon para su validación.');
  }

  onFormChanged(updated: DatosDomicilioModel): void {
    this.direccion.set(updated);
    if (this.formDisabled()) {
      this.formDisabled.set(false);
      this.avisoTexto.set('');
    }
  }

  onCodigoPostalChanged(codigoPostal: string): void {
    const address = { ...this.direccion(), codigoPostal };
    this.direccion.set(address);
    if (this.formDisabled()) {
      this.formDisabled.set(false);
      this.avisoTexto.set('');
    }
  }

  public validate(): void {
    // No-op: this step is validated by the parent next logic.
  }

  public onParentNext(): boolean {
    const current = this.direccion();
    const ready =
      current.tipoVia.trim() &&
      current.nombreVia.trim() &&
      current.numero.trim() &&
      current.codigoPostal.trim() &&
      current.provincia.trim() &&
      current.localidad.trim();

    if (!ready) {
      this.avisoTexto.set('Completa todos los campos de la dirección antes de continuar.');
      return true;
    }

    if (!this.normalized()) {
      this.datosService.normalizeAddress(current).subscribe((normalized) => {
        this.direccion.set(normalized);
        this.normalized.set(true);
        const domicilioString = formatDireccionToString(normalized);
        this.model.set({ domicilio: domicilioString });
        this.save.emit({ domicilio: domicilioString });
        this.usoState.completeDireccionTomador();
        this.direccionCompleted.emit();
        this.avisoTexto.set('La dirección ha sido normalizada.');
      });

      this.avisoTexto.set('Normalizando la dirección antes de continuar...');
      return true;
    }

    return false;
  }
}
