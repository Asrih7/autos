import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BalHeading, BalToast } from '@baloise/ds-angular';
import { TranslateModule } from '@ngx-translate/core';
import { DireccionModel } from '../../models/direccion.model';
import { UsoConductoresStateService } from '../../uso-conductores-state.service';
import { DatosDomicilioModel, formatDireccionToString, EMPTY_DATOS_DOMICILIO } from '../../../../../../../../libs/shared/ui/src/lib/address.model';
import { DatosDomicilioService } from '../../../../../../../../libs/shared/ui/src/lib/datos-domicilio.service';
import { DatosDomicilioGoogle } from '../../../../../../../../libs/shared/ui/src/lib/datos-domicilio-google/datos-domicilio-google';
import { DatosDomicilioForm } from '../../../../../../../../libs/shared/ui/src/lib/datos-domicilio-form/datos-domicilio-form';

@Component({
  selector: 'app-direccion-tomador',
  standalone: true,
  imports: [CommonModule, FormsModule, BalHeading, BalToast, TranslateModule, DatosDomicilioGoogle, DatosDomicilioForm],
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
  toastOpen = signal(false);
  toastMessage = signal('');
  toastType = signal<'success' | 'info' | 'warning' | 'danger'>('success');

  readonly toastDurationMs = 3000;

  private processing = false;
  private fromGoogle = false;

  private readonly usoState = inject(UsoConductoresStateService);
  private readonly datosService = inject(DatosDomicilioService);

  ngOnInit(): void {
  this.stepSelected.emit('direccion-tomador');

  const savedDireccion = this.usoState.direccionTomador();
  const completed = this.usoState.direccionTomadorCompleted();
  const fromGoogle = this.usoState.direccionTomadorFromGoogle();

  if (savedDireccion && Object.values(savedDireccion).some(v => v?.toString().trim())) {

    this.direccion.set({
      ...EMPTY_DATOS_DOMICILIO,
      ...savedDireccion
    });

    this.model.set({ domicilio: formatDireccionToString(savedDireccion) });

    if (completed && this.isReady(savedDireccion)) {
      this.normalized.set(true);
    }

    if (fromGoogle) {
      this.formDisabled.set(true);
    }

    this.maybeNormalize();
  } else if (this.initial?.domicilio) {
    this.model.set({ domicilio: this.initial.domicilio });
  }
}


  onAddressSelected(address: DatosDomicilioModel): void {
    this.fromGoogle = true;

    this.direccion.set(address);
    this.model.set({ domicilio: formatDireccionToString(address) });
    this.saveDireccionToState(address);

    this.usoState.setDireccionTomadorFromGoogle(true);

    this.formDisabled.set(true);
    this.normalized.set(false);
    this.usoState.resetDireccionTomador();

    this.maybeNormalize();
  }

  onFormChanged(updated: DatosDomicilioModel): void {
    if (this.fromGoogle) {
      this.fromGoogle = false;
      return;
    }

    this.direccion.set(updated);
    this.model.set({ domicilio: formatDireccionToString(updated) });
    this.saveDireccionToState(updated);

    this.normalized.set(false);
    this.usoState.resetDireccionTomador();

    this.maybeNormalize();
  }

  onCodigoPostalChanged(codigoPostal: string): void {
    if (this.fromGoogle) {
      this.fromGoogle = false;
      return;
    }

    const address = { ...this.direccion(), codigoPostal };
    this.direccion.set(address);
    this.model.set({ domicilio: formatDireccionToString(address) });
    this.saveDireccionToState(address);

    this.normalized.set(false);
    this.usoState.resetDireccionTomador();

    this.maybeNormalize();
  }

  private saveDireccionToState(address: DatosDomicilioModel): void {
    this.usoState.updateDireccionTomador(address);
  }

  public validate(): void {}

  public onParentNext(): boolean {
    const current = this.direccion();
    const ready = this.isReady(current);

    if (!ready) {
      this.showToast('Completa todos los campos de la dirección antes de continuar.', 'warning');
      return true;
    }

    if (this.normalized()) {
      return false;
    }

    this.maybeNormalize();
    return true;
  }

  private maybeNormalize(): void {
    const current = this.direccion();

    if (!this.isReady(current) || this.normalized() || this.processing) {
      return;
    }

    this.processing = true;

    this.datosService.normalizeAddress(current).subscribe({
      next: (normalized: DatosDomicilioModel) => {
        this.direccion.set(normalized);
        this.normalized.set(true);
        const domicilioString = formatDireccionToString(normalized);
        this.model.set({ domicilio: domicilioString });
        this.saveDireccionToState(normalized);
        this.processing = false;

        this.showToast('La dirección ha sido normalizada.', 'success');

        this.save.emit({ domicilio: domicilioString });
        this.usoState.completeDireccionTomador();
        this.direccionCompleted.emit();
      },
      error: () => {
        this.processing = false;
        this.showToast('No se ha podido normalizar la dirección. Inténtalo de nuevo.', 'danger');
      },
    });
  }

  private isReady(current: DatosDomicilioModel): boolean {
    return !!(
      current.tipoVia.trim() &&
      current.nombreVia.trim() &&
      current.numero.trim() &&
      current.codigoPostal.trim() &&
      current.provincia.trim() &&
      current.localidad.trim()
    );
  }

  private showToast(message: string, type: 'success' | 'info' | 'warning' | 'danger' = 'success'): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.toastOpen.set(true);
  }
}
