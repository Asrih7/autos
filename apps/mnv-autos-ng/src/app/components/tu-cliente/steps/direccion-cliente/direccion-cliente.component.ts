import { AfterViewInit, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { BalHeading } from '@baloise/ds-angular';
import { CommonModule } from '@angular/common';
import { DatosDomicilioForm, DatosDomicilioGoogle, DatosDomicilioModel, EMPTY_DATOS_DOMICILIO } from '@mnv-autos-ng/ui';

@Component({
  selector: 'app-direccion-cliente',
  standalone: true,
  imports: [CommonModule, BalHeading, DatosDomicilioGoogle, DatosDomicilioForm],
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
}
