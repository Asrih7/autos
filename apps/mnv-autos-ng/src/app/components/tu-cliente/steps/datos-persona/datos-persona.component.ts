import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DatosPersona, type DatosPersonaModel, provideDatosPersonaOptionsApi } from '@mnv-autos-ng/ui';

@Component({
  selector: 'app-datos-persona',
  standalone: true,
  imports: [CommonModule, DatosPersona],
  providers: [provideDatosPersonaOptionsApi()],
  templateUrl: './datos-persona.component.html',
  styleUrl: './datos-persona.component.scss',
})
export class DatosPersonaComponent {
  @Input() initialModel: DatosPersonaModel = {
    documentType: undefined,
    documentNumber: '',
    nationality: undefined,
    firstName: '',
    firstSurname: '',
    secondSurname: '',
    businessName: '',
    sameBeneficiary: true,
  };

  @Output() modelChange = new EventEmitter<DatosPersonaModel>();
}
