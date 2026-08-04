import { Component, EventEmitter, inject, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import {
  BalCheckbox,
  BalField,
  BalFieldControl,
  BalFieldLabel,
  BalFieldMessage,
  BalHeading,
  BalInput,
  BalSelect,
  BalSelectOption,
} from '@baloise/ds-angular';
import { TranslateModule } from '@ngx-translate/core';
import { DATOS_PERSONA_OPTIONS_API, type DatosPersonaOptionsApi } from './data-access/datos-persona-options.api';
import { DOCUMENT_TYPES } from './data-access/mock-datos-persona-options';
import type { DatosPersonaModel } from './models/datos-persona.model';

@Component({
  selector: 'lib-datos-persona',
  standalone: true,
  imports: [ BalHeading, BalField, BalFieldControl, BalFieldLabel, BalInput, BalSelect, BalSelectOption, BalCheckbox, TranslateModule, BalFieldMessage],
  templateUrl: './datos-persona.component.html',
})
export class DatosPersona implements OnChanges {
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

  @Input() title = 'tuCliente.personalData.title';
  @Input() firstNameLabel = 'tuCliente.personalData.firstName';
  @Input() firstSurnameLabel = 'tuCliente.personalData.firstSurname';
  @Input() secondSurnameLabel = 'tuCliente.personalData.secondSurname';
  @Input() businessNameLabel = 'tuCliente.personalData.businessName';
  @Input() documentTypeLabel = 'tuCliente.personalData.documentType';
  @Input() documentNumberLabel = 'tuCliente.personalData.documentNumber';
  @Input() nationalityLabel = 'tuCliente.personalData.nationality';
  @Input() beneficiaryLabel = 'tuCliente.personalData.sameBeneficiary';

  model: DatosPersonaModel = { ...this.initialModel };
  documentNumberTouched = false;
  nationalityTouched = false;
  options: {
    documentTypes: readonly { value: string; label: string }[];
    nationalities: readonly { value: string; label: string }[];
  } = {
    documentTypes: DOCUMENT_TYPES,
    nationalities: [],
  };

  private readonly optionsApi = inject(DATOS_PERSONA_OPTIONS_API) as DatosPersonaOptionsApi;

  ngOnChanges(changes: SimpleChanges): void {
    if ('initialModel' in changes) {
      this.model = { ...this.initialModel };
      this.documentNumberTouched = false;
      this.nationalityTouched = false;
      this.options = {
        documentTypes: DOCUMENT_TYPES,
        nationalities: [],
      };
      this.optionsApi.getOptions().subscribe({
        next: (options) => {
          this.options = {
            documentTypes: options.documentTypes.length > 0 ? options.documentTypes : DOCUMENT_TYPES,
            nationalities: options.nationalities,
          };
        },
        error: () => {
          this.options = {
            documentTypes: DOCUMENT_TYPES,
            nationalities: [],
          };
        },
      });
    }
  }

  get selectedDocumentType(): string | undefined {
    return this.model.documentType?.toUpperCase();
  }

  get selectedNationality(): string | undefined {
    return this.model.nationality;
  }

  get isCifSelected(): boolean {
    return this.model.documentType === 'cif';
  }

  get documentNumberError(): string | null {
    if (!this.documentNumberTouched) {
      return null;
    }

    return this.validateDocumentNumber(this.model.documentType, this.model.documentNumber);
  }

  get documentNumberInvalid(): boolean {
    return this.documentNumberError !== null;
  }

  get nationalityInvalid(): boolean {
    return this.nationalityTouched && this.selectedNationality === undefined;
  }

  get documentNumberErrorMessage(): string {
    const error = this.documentNumberError;
    return error ? this.getErrorMessage(error) : '';
  }

  protected handleDocumentTypeChange(event: Event): void {
    if (!(event instanceof CustomEvent)) {
      return;
    }

    const documentType = this.parseDocumentType(event.detail);
    this.updateModel({ documentType });
  }

  protected handleDocumentNumberInput(event: Event): void {
    if (!(event instanceof CustomEvent)) {
      return;
    }

    this.updateModel({
      documentNumber: typeof event.detail === 'string' ? event.detail : '',
    });
  }

  protected handleDocumentNumberBlur(): void {
    this.documentNumberTouched = true;
  }

  protected handleNationalityInput(): void {
    this.updateModel({ nationality: undefined });
  }

  protected handleNationalityChange(event: Event): void {
    if (!(event instanceof CustomEvent) || typeof event.detail !== 'string') {
      this.updateModel({ nationality: undefined });
      return;
    }

    const isValidNationality = this.options.nationalities.some(
      (option) => option.value === event.detail,
    );

    this.updateModel({ nationality: isValidNationality ? event.detail : undefined });
  }

  protected handleNationalityBlur(): void {
    this.nationalityTouched = true;
  }

  protected setField(field: keyof DatosPersonaModel, value: string | boolean): void {
    this.updateModel({ [field]: value } as Partial<DatosPersonaModel>);
  }

  private updateModel(update: Partial<DatosPersonaModel>): void {
    this.model = { ...this.model, ...update };
    this.modelChange.emit(this.model);
  }

  private getErrorMessage(error: string): string {
    const messages: Record<string, string> = {
      documentTypeRequired: 'tuCliente.personalData.errors.documentTypeRequired',
      required: 'tuCliente.personalData.errors.required',
      invalidDni: 'tuCliente.personalData.errors.invalidDni',
      invalidNif: 'tuCliente.personalData.errors.invalidNif',
      invalidCif: 'tuCliente.personalData.errors.invalidCif',
      invalidPassport: 'tuCliente.personalData.errors.invalidPassport',
    };

    return messages[error] ?? '';
  }

  private parseDocumentType(value: unknown): DatosPersonaModel['documentType'] {
    if (typeof value !== 'string') {
      return undefined;
    }

    const normalized = value.trim().toLowerCase();
    if (normalized === 'pas') {
      return 'passport';
    }

    return normalized === 'dni' || normalized === 'nif' || normalized === 'cif' || normalized === 'passport'
      ? normalized
      : undefined;
  }

  private validateDocumentNumber(documentType: DatosPersonaModel['documentType'], documentNumber: string): string | null {
    const value = documentNumber.trim();
    if (!documentType) return 'documentTypeRequired';
    if (!value) return 'required';

    switch (documentType) {
      case 'dni':
        return /^[0-9]{8}[A-Za-z]$/.test(value) ? null : 'invalidDni';
      case 'nif':
        return /^[0-9]{8}[A-Za-z]$/.test(value) ? null : 'invalidNif';
      case 'cif':
        return /^[A-Za-z][0-9]{7}[A-Za-z0-9]$/.test(value) ? null : 'invalidCif';
      case 'passport':
        return /^[A-Za-z0-9]{6,9}$/.test(value) ? null : 'invalidPassport';
      default:
        return null;
    }
  }
}
