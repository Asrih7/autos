import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DatosPersona, type DatosPersonaModel } from '@mnv-autos-ng/ui';

@Component({
  selector: 'app-datos-persona',
  standalone: true,
  imports: [DatosPersona],
  templateUrl: './datos-persona.component.html',
})
export class DatosPersonaStepComponent {
  @Input() model: DatosPersonaModel = {
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
  @Input() compact = false;
  @Input() onlyNameFields = false;
  @Input() showNationality = false;
    @Input() disabledDocuments = false;
  @Input() disabledNationality = false;

}
