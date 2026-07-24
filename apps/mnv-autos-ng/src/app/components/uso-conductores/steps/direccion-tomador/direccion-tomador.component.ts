import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BalHeading, BalToast } from '@baloise/ds-angular';
import { TranslateModule } from '@ngx-translate/core';
import { DireccionModel } from '../../models/direccion.model';
import { UsoConductoresStateService } from '../../uso-conductores-state.service';
import { DatosDomicilioModel, EMPTY_DATOS_DOMICILIO, formatDireccionToString } from '../../../../../../../../libs/shared/ui/src/lib/address.model';
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
  @Input() context: 'tomador' | 'vehiculo' | 'propietario' = 'tomador';
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

  private readonly usoState = inject(UsoConductoresStateService);

  ngOnInit(): void {
    this.stepSelected.emit('direccion-tomador');
    const savedDireccion = this.usoState.direccionTomador();
    const completed = this.usoState.direccionTomadorCompleted();
    const fromGoogle = this.usoState.direccionTomadorFromGoogle();

    if (Object.values(savedDireccion).some((value) => value?.toString().trim())) {
      this.direccion.set({ ...EMPTY_DATOS_DOMICILIO, ...savedDireccion });
      this.model.set({ domicilio: formatDireccionToString(savedDireccion) });
      this.normalized.set(completed && this.isReady(savedDireccion));
      this.formDisabled.set(fromGoogle);
    } else if (this.initial?.domicilio) {
      this.model.set({ domicilio: this.initial.domicilio });
    }
  }

  onAddressSelected(address: DatosDomicilioModel): void {
    this.usoState.setDireccionTomadorFromGoogle(true);
    this.formDisabled.set(true);
    this.normalized.set(false);
    this.usoState.resetDireccionTomador();
    this.updateAddress(address);
  }

  onFormChanged(updated: DatosDomicilioModel): void {
    this.updateAddress(updated);
    if (!this.formDisabled()) {
      this.normalized.set(false);
      this.usoState.resetDireccionTomador();
    }
  }

  public validate(): void {}

  public onParentNext(): boolean {
    if (!this.isReady(this.direccion())) {
      this.showToast('Completa todos los campos de la direccion antes de continuar.', 'warning');
      return true;
    }
    return false;
  }

  public applyNormalizedAddress(normalized: DatosDomicilioModel): void {
    this.updateAddress(normalized);
    this.normalized.set(true);
    this.showToast('La direccion ha sido normalizada.', 'success');
    this.save.emit({ domicilio: formatDireccionToString(normalized) });
    this.direccionCompleted.emit();
  }

  public showNormalisationFailure(): void {
    this.showToast('No se ha podido normalizar la direccion. Intentalo de nuevo.', 'danger');
  }

  get titleKey(): string { return `usoConductores.intervinientes.address.${this.context}.title`; }
  get subtitleKey(): string { return `usoConductores.intervinientes.address.${this.context}.subtitle`; }
  get placeholderKey(): string { return `usoConductores.intervinientes.address.${this.context}.placeholder`; }
  get ariaLabelKey(): string { return `usoConductores.intervinientes.address.${this.context}.ariaLabel`; }

  private updateAddress(address: DatosDomicilioModel): void {
    this.direccion.set(address);
    this.model.set({ domicilio: formatDireccionToString(address) });
    this.usoState.updateDireccionTomador(address);
  }

  private isReady(current: DatosDomicilioModel): boolean {
    return [current.tipoVia, current.nombreVia, current.numero, current.codigoPostal, current.provincia, current.localidad]
      .every((value) => value.trim().length > 0);
  }

  private showToast(message: string, type: 'success' | 'info' | 'warning' | 'danger'): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.toastOpen.set(true);
  }
}
