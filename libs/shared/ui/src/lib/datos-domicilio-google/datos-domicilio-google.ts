import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BalHeading, BalSelect, BalSelectOption, parseCustomEvent } from '@baloise/ds-angular';
import { TranslateModule } from '@ngx-translate/core';
import { DatosDomicilioModel } from '../address.model';

const GOOGLE_SUGGESTIONS = [
  'Calle Mayor 1, 28013 Madrid',
  'Avenida de la Constitución 12, 28014 Madrid',
  'Plaza España 5, 28008 Madrid',
  'Calle del Laurel 14, 28006 Logroño',
  'Calle Sierpes 8, 41002 Sevilla',
];

@Component({
  selector: 'app-datos-domicilio-google',
  standalone: true,
  imports: [CommonModule, FormsModule, BalSelect, BalSelectOption, BalHeading, TranslateModule],
  templateUrl: './datos-domicilio-google.html',
})
export class DatosDomicilioGoogle {
  @Input() value = '';
  @Output() addressSelected = new EventEmitter<DatosDomicilioModel>();

  readonly searchValue = signal('');
  readonly filteredSuggestions = signal<string[]>([...GOOGLE_SUGGESTIONS]);
  readonly placeholder = 'Busca una dirección con Google';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value']) {
      this.searchValue.set(this.value ?? '');
      this.refreshSuggestions();
    }
  }

  onInput(event: any): void {
    const value = this.readInputValue(event).trim();
    this.searchValue.set(value);
    this.refreshSuggestions();
  }

  onSelectChange(event: any): void {
    const parsed = parseCustomEvent(event);
    const raw = this.readSelectValue(event).trim();
    const value = String(parsed ?? raw ?? '').trim();
    if (!value) {
      return;
    }
    this.searchValue.set(value);
    this.filteredSuggestions.set([value]);
    this.addressSelected.emit(this.parseSuggestion(value));
  }

  private readSelectValue(event: unknown): string {
    const source = event as any;
    let raw = source?.detail?.value ?? source?.detail ?? source?.target?.value ?? source ?? '';

    if (Array.isArray(raw) && raw.length > 0) {
      raw = raw[0];
    }
    if (typeof raw === 'object' && raw !== null) {
      raw = raw?.value ?? raw?.detail ?? raw?.label ?? '';
    }

    return String(raw ?? '');
  }

  private refreshSuggestions(): void {
    const query = this.searchValue().toLowerCase().trim();
    if (!query) {
      this.filteredSuggestions.set([...GOOGLE_SUGGESTIONS]);
      return;
    }

    this.filteredSuggestions.set(
      GOOGLE_SUGGESTIONS.filter((item) => item.toLowerCase().includes(query)).slice(0, 6),
    );
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

  private readInputValue(event: unknown): string {
    const source = event as any;
    return (
      source?.detail?.value ??
      source?.detail ??
      source?.target?.value ??
      source ??
      ''
    ).toString();
  }
}
