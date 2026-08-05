import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BuscadorClienteComponent } from '@mnv-autos-ng/ui';

@Component({
  selector: 'app-cliente-busqueda',
  standalone: true,
  imports: [BuscadorClienteComponent],
  templateUrl: './cliente-busqueda.component.html',
  
})
export class ClienteBusquedaComponent {
  @Input() value = '';
  @Input() error: string | null = null;
  @Input() searching = false;

  @Output() valueChange = new EventEmitter<string>();
  @Output() searchRequested = new EventEmitter<string>();
}
