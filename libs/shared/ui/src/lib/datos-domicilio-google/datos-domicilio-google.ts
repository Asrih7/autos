import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BalHeading, BalDropdown, BalOption } from '@baloise/ds-angular';
import { TranslateModule } from '@ngx-translate/core';
import { DatosDomicilioModel } from '../address.model';

const GOOGLE_SUGGESTIONS = [
  'Calle Mayor 1, 28013 Madrid',
  'Avenida de la Constitución 12, 28014 Madrid',
  'Plaza España 5, 28008 Madrid',
  'Calle del Laurel 14, 28006 Logroño',
  'Calle Sierpes 8, 41002 Sevilla',
];

interface SuggestionOption {
  id: string;
  label: string;
}

@Component({
  selector: 'app-datos-domicilio-google',
  standalone: true,
  imports: [CommonModule, FormsModule, BalDropdown, BalOption, BalHeading, TranslateModule],
  templateUrl: './datos-domicilio-google.html',
})
export class DatosDomicilioGoogle implements OnChanges {
  @Input() value = '';
  @Output() addressSelected = new EventEmitter<DatosDomicilioModel>();

  readonly placeholder = 'Busca una dirección con Google';

   options = signal<SuggestionOption[]>(
    GOOGLE_SUGGESTIONS.map((label, index) => ({ id: `opt-${index}`, label })),
  );

  selectedValue = signal('');

  private nextId = GOOGLE_SUGGESTIONS.length;

  ngOnChanges(changes: SimpleChanges): void {
    if ('value' in changes) {
      const incoming = String(this.value ?? '').trim();

      if (!incoming) {
        this.selectedValue.set('');
        return;
      }

      const existing = this.options().find((opt) => opt.label === incoming);
      if (existing) {
        this.selectedValue.set(existing.id);
        return;
      }

      const newOption: SuggestionOption = { id: `opt-${this.nextId++}`, label: incoming };
      this.options.update((current) => [...current, newOption]);
      this.selectedValue.set(newOption.id);
    }
  }

  onSelectChange(event: any): void {
    const selectedId = String(event?.detail ?? '').trim();
    if (!selectedId) return;

    const option = this.options().find((opt) => opt.id === selectedId);
    if (!option) return;

    this.selectedValue.set(selectedId);
    this.addressSelected.emit(this.parseSuggestion(option.label));
  }

  private parseSuggestion(suggestion: string): DatosDomicilioModel {
    const partes = suggestion.split(',').map((part) => part.trim());
    const callePart = partes[0] ?? '';
    const cpYLocalidad = partes[1] ?? '';

    const calleTokens = callePart.split(' ');
    const tipoVia = calleTokens[0] ?? '';
    const numero = calleTokens[calleTokens.length - 1] ?? '';
    const nombreVia = calleTokens.slice(1, -1).join(' ');

    const cpTokens = cpYLocalidad.split(' ');
    const codigoPostal = cpTokens[0] ?? '';
    const localidad = cpTokens.slice(1).join(' ') ?? '';

    return {
      tipoVia,
      nombreVia,
      numero,
      codigoPostal,
      provincia: localidad,
      localidad,
    };
  }
}