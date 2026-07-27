import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BuscadorClienteComponent } from '@mnv-autos-ng/ui';

@Component({
  selector: 'app-cliente-busqueda',
  standalone: true,
  imports: [CommonModule, BuscadorClienteComponent],
  templateUrl: './cliente-busqueda.component.html',
  
})
export class ClienteBusquedaComponent {
  @Input() value = '';
  @Input() error: string | null = null;
  @Input() searching = false;

  @Output() valueChange = new EventEmitter<string>();
  @Output() searchRequested = new EventEmitter<string>();
}
