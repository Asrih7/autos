import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BalField, BalFieldControl, BalFieldLabel, BalFieldMessage, BalInputDate } from '@baloise/ds-angular';

@Component({
  selector: 'lib-fecha-nacimiento',
  standalone: true,
  imports: [CommonModule, BalField, BalFieldControl, BalFieldLabel, BalInputDate, BalFieldMessage],
  templateUrl: './fecha-nacimiento.component.html',
})
export class FechaNacimiento {
  @Input() label = 'Fecha de nacimiento';
  @Input() name = 'birthDate';
  @Input() placeholder = 'DD/MM/AAAA*';
  @Input() required = true;
  @Input() invalidMessage = 'Introduce una fecha válida';
  @Input() value?: string;
  @Output() valueChange = new EventEmitter<string | undefined>();
  @Output() invalidChange = new EventEmitter<boolean>();

  protected invalid = false;

  protected handleDateChange(event: Event): void {
    if (!(event instanceof CustomEvent)) {
      return;
    }

    const value = typeof event.detail === 'string' && event.detail ? event.detail : undefined;
    this.valueChange.emit(value);
    this.invalid = this.required && value === undefined;
    this.invalidChange.emit(this.invalid);
  }

  protected handleDateBlur(): void {
    if (this.required && !this.value) {
      this.invalid = true;
      this.invalidChange.emit(this.invalid);
    }
  }
}
