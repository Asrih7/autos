import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FechaNacimiento as SharedFechaNacimiento } from '@mnv-autos-ng/ui';

@Component({
  selector: 'app-fecha-nacimiento',
  standalone: true,
  imports: [CommonModule, SharedFechaNacimiento],
  templateUrl: './fecha-nacimiento.component.html',
})
export class FechaNacimientoComponent {
  @Input() label = '';
  @Input() value?: string;
  @Output() valueChange = new EventEmitter<string | undefined>();
}
