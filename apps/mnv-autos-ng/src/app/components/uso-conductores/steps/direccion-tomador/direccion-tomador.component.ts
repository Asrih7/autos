import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BalHeading, BalToast } from '@baloise/ds-angular';
import { TranslateModule } from '@ngx-translate/core';
import { DireccionModel } from '../../models/direccion.model';
import { UsoConductoresStateService } from '../../uso-conductores-state.service';
import { DatosDomicilioGoogle,DatosDomicilioForm,DatosDomicilioService, DatosDomicilioModel, EMPTY_DATOS_DOMICILIO, formatDireccionToString } from "@mnv-autos-ng/ui";

import { take } from 'rxjs';
import { UsoConductoresComponent } from '../../uso-conductores.component';

@Component({
  selector: 'app-direccion-tomador',
  standalone: true,
  imports: [CommonModule, FormsModule, BalHeading, TranslateModule, DatosDomicilioGoogle, DatosDomicilioForm],
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
  private readonly datosDomicilioService = inject(DatosDomicilioService);
  private parent = inject(UsoConductoresComponent);

fieldDisabled = signal({
  tipoVia: false,
  nombreVia: false,
  numero: false,
  codigoPostal: false,
  provincia: false,
  localidad: false
});


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
  this.normalized.set(false);
  this.usoState.resetDireccionTomador();

  const flags = {
  tipoVia: !!address.tipoVia?.trim(),        // Google lo rellenó → bloquear
  nombreVia: !!address.nombreVia?.trim(),
  numero: !!address.numero?.trim(),
  codigoPostal: !!address.codigoPostal?.trim(),
  provincia: !!address.provincia?.trim(),
  localidad: !!address.localidad?.trim()
};


  this.fieldDisabled.set(flags);

  const allFilled = Object.values(flags).every(v => v === true);
  this.formDisabled.set(allFilled);

  this.updateAddress(address);
  this.enrichGoogleAddressFromPostalCode(address);
}



  onFormChanged(updated: DatosDomicilioModel): void {
    // Component controls can emit an empty value while being re-created after
    // navigation. Preserve already saved address fields in that situation.
    this.updateAddress(updated, true);
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

  /**
   * ÚNICA fuente de verdad para normalizar el domicilio del tomador.
   *
   * El contenedor/página que gestiona el botón "Continuar" del footer
   * (PageNavigationService -> activePageConfig().beforeNavigateNext) debe
   * llamar a ESTE método en vez de invocar `datosDomicilioService.normalizeAddress(...)`
   * por su cuenta con una copia de la dirección reconstruida a mano. Ese era
   * el origen del bug: se enviaba a normalizar un objeto desincronizado del
   * formulario en pantalla, y el resultado sustituía visualmente todo.
   *
   * Devuelve una Promise<boolean> pensada para encajar directamente como
   * `beforeNavigateNext` (que espera `boolean | Promise<boolean>`):
   *   - true  -> se puede continuar a la siguiente página
   *   - false -> bloquear la navegación (campos incompletos o error de BDI)
   */
  public normalizeAddress(): Promise<boolean> {
    const current = this.direccion();

    if (!this.isReady(current)) {
      this.showIncompleteAddress();
      return Promise.resolve(false);
    }

    // Si ya se ha normalizado esta misma dirección (p.ej. el usuario pulsa
    // "Continuar" dos veces sin tocar nada), no hace falta repetir la llamada.
    if (this.normalized()) {
      return Promise.resolve(true);
    }

    return new Promise<boolean>((resolve) => {
      this.datosDomicilioService
        .normalizeAddress(current)
        .pipe(take(1))
        .subscribe({
          next: (normalized) => {
            this.applyNormalizedAddress(normalized);
            resolve(true);
          },
          error: () => {
            this.showNormalisationFailure();
            resolve(false);
          },
        });
    });
  }

  public applyNormalizedAddress(normalized: DatosDomicilioModel): void {
    this.updateAddress(normalized);
    this.normalized.set(true);
    this.parent.showToast('La direccion ha sido normalizada.', 'success');
    this.save.emit({ domicilio: formatDireccionToString(normalized) });
    this.direccionCompleted.emit();
  }

 // direccion-tomador.component.ts

public showNormalisationFailure(): void {
  this.parent.showToast('No se ha podido normalizar la direccion. Intentalo de nuevo.', 'danger');
}

public showIncompleteAddress(): void {
  this.parent.showToast('Completa todos los campos de la direccion antes de continuar.', 'warning');
}

// used by onParentNext()
private showToast(message: string, type: 'success' | 'info' | 'warning' | 'danger'): void {
  this.parent.showToast(message, type);
}

  get titleKey(): string { return `usoConductores.intervinientes.address.${this.context}.title`; }
  get subtitleKey(): string { return `usoConductores.intervinientes.address.${this.context}.subtitle`; }
  get placeholderKey(): string { return `usoConductores.intervinientes.address.${this.context}.placeholder`; }
  get ariaLabelKey(): string { return `usoConductores.intervinientes.address.${this.context}.ariaLabel`; }

  private updateAddress(address: DatosDomicilioModel, preserveExisting = false): void {
    const current = this.direccion();
    const valueOrSaved = (value: string, saved: string) => value?.trim() ? value : saved;
    const next = preserveExisting
      ? {
          tipoVia: valueOrSaved(address.tipoVia, current.tipoVia),
          nombreVia: valueOrSaved(address.nombreVia, current.nombreVia),
          numero: valueOrSaved(address.numero, current.numero),
          codigoPostal: valueOrSaved(address.codigoPostal, current.codigoPostal),
          provincia: valueOrSaved(address.provincia, current.provincia),
          localidad: valueOrSaved(address.localidad, current.localidad),
        }
      : { ...EMPTY_DATOS_DOMICILIO, ...address };

    this.direccion.set(next);
    this.model.set({ domicilio: formatDireccionToString(next) });
    this.usoState.updateDireccionTomador(next);
  }

  /** Google can omit administrative components for Spanish addresses. The BDI
   * CP lookup is the source of truth for the read-only province/locality. */
  private enrichGoogleAddressFromPostalCode(address: DatosDomicilioModel): void {
    const codigoPostal = address.codigoPostal.slice(0, 5);
    if (codigoPostal.length !== 5) return;

    this.datosDomicilioService.getAddressData(codigoPostal).pipe(take(1)).subscribe(({ localidades, provincias, provincia }) => {
      const current = this.direccion();
      // Ignore a delayed response for an address the user has already changed.
      if (current.codigoPostal.slice(0, 5) !== codigoPostal) return;
      const localidad = localidades.find(
        option => option.value.trim().toLocaleLowerCase() === current.localidad.trim().toLocaleLowerCase(),
      )?.value ?? localidades[0]?.value ?? current.localidad;
      const provinciaResuelta = provincia ?? provincias[0]?.value ?? current.provincia;

      if (provinciaResuelta !== current.provincia || localidad !== current.localidad) {
        this.updateAddress({ ...current, provincia: provinciaResuelta, localidad });
      }
    });
  }

  private isReady(current: DatosDomicilioModel): boolean {
    return [current.tipoVia, current.nombreVia, current.numero, current.codigoPostal, current.provincia, current.localidad]
      .every((value) => value.trim().length > 0);
  }


}