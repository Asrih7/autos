import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { BalHeading } from '@baloise/ds-angular';
import {
  DatosDomicilioGoogle,
  DatosDomicilioForm,
  DatosDomicilioService,
  DatosDomicilioModel,
  EMPTY_DATOS_DOMICILIO,
  formatDireccionToString,
} from '@mnv-autos-ng/ui';
import { TranslateModule } from '@ngx-translate/core';
import { take } from 'rxjs';


@Component({
  selector: 'app-direccion-cliente',
  standalone: true,
  imports: [BalHeading, DatosDomicilioGoogle, DatosDomicilioForm, TranslateModule],
  templateUrl: './direccion-cliente.component.html',
})
export class DireccionClienteComponent implements OnChanges {
  @Input() direccion: DatosDomicilioModel = EMPTY_DATOS_DOMICILIO;

  @Output() direccionChange = new EventEmitter<DatosDomicilioModel>();

  internalDireccion: DatosDomicilioModel = { ...EMPTY_DATOS_DOMICILIO };
  direccionTexto: string = '';

  private readonly datosDomicilioService = inject(DatosDomicilioService);

  ngOnChanges(changes: SimpleChanges): void {
    if ('direccion' in changes) {
      this.internalDireccion = {
        tipoVia: this.direccion.tipoVia != null ? this.direccion.tipoVia.trim() : this.internalDireccion.tipoVia,
        nombreVia: this.direccion.nombreVia != null ? this.direccion.nombreVia.trim() : this.internalDireccion.nombreVia,
        numero: this.direccion.numero != null ? this.direccion.numero.trim() : this.internalDireccion.numero,
        codigoPostal: this.direccion.codigoPostal != null ? this.direccion.codigoPostal.trim() : this.internalDireccion.codigoPostal,
        provincia: this.direccion.provincia != null ? this.direccion.provincia.trim() : this.internalDireccion.provincia,
        localidad: this.direccion.localidad != null ? this.direccion.localidad.trim() : this.internalDireccion.localidad,
      };
      this.direccionTexto = formatDireccionToString(this.internalDireccion);
    }
  }

  onDireccionChange(direccion: DatosDomicilioModel): void {
    this.updateAddress(direccion);
  }

  /**
   * Google selecciona una dirección → pero NO bloqueamos nada.
   * Solo actualizamos el modelo y enriquecemos CP.
   */
  onAddressSelected(address: DatosDomicilioModel): void {
    this.updateAddress(address);
    this.enrichAddressFromPostalCode(address);
  }

  /**
   * El formulario cambia → actualizamos modelo sin bloquear nada.
   */
  onFormChanged(updated: DatosDomicilioModel): void {
    this.updateAddress(updated);
  }

  clearSelection(): void {
    this.onDireccionChange({ ...EMPTY_DATOS_DOMICILIO });
  }

  /**
   * Única fuente de verdad para actualizar la dirección visible,
   * el texto del buscador de Google y el modelo del padre.
   */
  private updateAddress(address: DatosDomicilioModel): void {
    const next = {
      ...EMPTY_DATOS_DOMICILIO,
      ...address,
      tipoVia: address.tipoVia?.trim() ?? '',
      nombreVia: address.nombreVia?.trim() ?? '',
      numero: address.numero?.trim() ?? '',
      codigoPostal: address.codigoPostal?.trim() ?? '',
      provincia: address.provincia?.trim() ?? '',
      localidad: address.localidad?.trim() ?? '',
    };

    this.internalDireccion = { ...next };
    this.direccionTexto = formatDireccionToString(next);
    this.direccionChange.emit({ ...next });
  }

  /**
   * Enriquecer provincia/localidad vía CP.
   */
  private enrichAddressFromPostalCode(address: DatosDomicilioModel): void {
    const codigoPostal = address.codigoPostal?.slice(0, 5) ?? '';
    if (codigoPostal.length !== 5) return;

    this.datosDomicilioService.getAddressData(codigoPostal).pipe(take(1)).subscribe(({ localidades, provincias, provincia }) => {
      if (this.internalDireccion.codigoPostal.slice(0, 5) !== codigoPostal) return;

      const localidad =
        localidades.find(
          (option) =>
            option.value.trim().toLocaleLowerCase() ===
            this.internalDireccion.localidad.trim().toLocaleLowerCase(),
        )?.value ??
        localidades[0]?.value ??
        this.internalDireccion.localidad;

      const provinciaResuelta =
        provincia ?? provincias[0]?.value ?? this.internalDireccion.provincia;

      if (provinciaResuelta !== this.internalDireccion.provincia || localidad !== this.internalDireccion.localidad) {
        this.updateAddress({ ...this.internalDireccion, provincia: provinciaResuelta, localidad });
      }
    });
  }
}
