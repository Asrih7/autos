import { Component, CUSTOM_ELEMENTS_SCHEMA, input, model, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

const INVALID_DATE_VALUE = 'INVALID_VALUE';

@Component({
  selector: 'app-fecha-nacimiento',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './fecha-nacimiento.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class FechaNacimiento {
  readonly label = input.required<string>();
  readonly name = input('birthDate');
  readonly placeholder = input('tuCliente.birthDate.placeholder');
  readonly required = input(true);
  readonly invalidMessage = input('tuCliente.birthDate.invalid');
  readonly value = model<string | undefined>(undefined);
  protected readonly invalid = signal(false);

  protected handleDateChange(event: Event): void {
    if (!(event instanceof CustomEvent)) {
      return;
    }

    if (event.detail === INVALID_DATE_VALUE) {
      this.value.set(undefined);
      this.invalid.set(true);
      return;
    }

    const value = typeof event.detail === 'string' && event.detail ? event.detail : undefined;

    this.value.set(value);
    this.invalid.set(this.required() && value === undefined);
  }

  protected handleDateBlur(): void {
    if (this.required() && !this.value()) {
      this.invalid.set(true);
    }
  }
}
