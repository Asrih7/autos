import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BalButton, BalField, BalFieldControl, BalFieldLabel, BalFieldMessage, BalInput } from '@baloise/ds-angular';

@Component({
  selector: 'lib-buscador-cliente',
  standalone: true,
  imports: [CommonModule, BalField, BalFieldControl, BalFieldLabel, BalInput, BalButton, BalFieldMessage],
  templateUrl: './cliente-busqueda.component.html',
  styleUrls: ['./cliente-busqueda.component.scss'],
})
export class BuscadorClienteComponent {
  @Input() documento = '';
  @Input() error: string | null = null;
  @Input() searching = false;
  @Output() documentoChange = new EventEmitter<string>();
  @Output() searchRequested = new EventEmitter<string>();

  protected onInput(event: Event): void {
    const detail = (event as CustomEvent)?.detail;
    const value = typeof detail === 'string' ? detail : '';
    this.documentoChange.emit(value);
  }

  protected search(): void {
    this.searchRequested.emit(this.documento.trim());
  }
}
