import { AfterViewInit, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { BalHeading } from '@baloise/ds-angular';
import { DatosDomicilioForm, DatosDomicilioGoogle, DatosDomicilioModel, EMPTY_DATOS_DOMICILIO } from '@mnv-autos-ng/ui';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-direccion-cliente',
  standalone: true,
  imports: [ BalHeading, DatosDomicilioGoogle, DatosDomicilioForm,TranslateModule],
  templateUrl: './direccion-cliente.component.html',
  
})
export class DireccionClienteComponent implements OnChanges {
  @Input() direccion: DatosDomicilioModel = EMPTY_DATOS_DOMICILIO;
  @Input() disabled = false;
  @Output() direccionChange = new EventEmitter<DatosDomicilioModel>();

  internalDireccion: DatosDomicilioModel = { ...EMPTY_DATOS_DOMICILIO };

  ngOnChanges(changes: SimpleChanges): void {
    if ('direccion' in changes) {
      this.internalDireccion = { ...this.direccion };
    }
  }

  onDireccionChange(direccion: DatosDomicilioModel): void {
    this.internalDireccion = { ...direccion };
    this.direccionChange.emit(this.internalDireccion);
  }

  onAddressSelected(address: DatosDomicilioModel): void {
    this.onDireccionChange(address);
  }

  clearSelection(): void {
    this.onDireccionChange({
      ...this.internalDireccion,
      tipoVia: '',
      nombreVia: '',
      numero: '',
      codigoPostal: '',
      provincia: '',
      localidad: '',
    });
  }
}
