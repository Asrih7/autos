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
import {
  AUTO_SPAIN_DOCUMENT_TYPES,
  parseDocumentType,
  validateDocumentNumber,
  validateSearchDocument,
} from './validation/document-number-validator';

const SPAIN_CODE = 'ES';

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
  @Input() disabledDocuments = false;
  @Input() disabledNationality = false;

  model: DatosPersonaModel = { ...this.initialModel };
  @Input() compact = false;
  @Input() onlyNameFields = false;
  @Input() showNationality = false;
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
          if (
            this.model.documentType &&
            AUTO_SPAIN_DOCUMENT_TYPES.includes(this.model.documentType) &&
            !this.model.nationality
          ) {
            this.updateModel({ nationality: this.findSpainOptionValue() });
          }
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

  /**
   * Criterio de aceptación: "en caso de CIF y DNI devuelve España como país
   * y a al NIE y NRT no le deja avanzar son poner el país". Para esos tipos
   * el país se autocompleta y el campo se bloquea; para el resto (NIE, NRT,
   * pasaporte) el agente tiene que seleccionarlo manualmente.
   */
  get requiresManualNationality(): boolean {
    const type = this.model.documentType;
    return !type || !AUTO_SPAIN_DOCUMENT_TYPES.includes(type);
  }

  get documentNumberError(): string | null {
    if (!this.documentNumberTouched) {
      return null;
    }

    return validateDocumentNumber(this.model.documentType, this.model.documentNumber);
  }

  get documentNumberInvalid(): boolean {
    return this.documentNumberError !== null;
  }

  get nationalityInvalid(): boolean {
    return this.requiresManualNationality && this.nationalityTouched && this.selectedNationality === undefined;
  }

  get documentNumberErrorMessage(): string {
    const error = this.documentNumberError;
    return error ? this.getErrorMessage(error) : '';
  }

  protected handleDocumentTypeChange(event: Event): void {
    if (!(event instanceof CustomEvent)) {
      return;
    }

    const documentType = parseDocumentType(event.detail);

    if (documentType && AUTO_SPAIN_DOCUMENT_TYPES.includes(documentType)) {
      this.updateModel({ documentType, nationality: this.findSpainOptionValue() });
    } else {
      this.updateModel({ documentType, nationality: undefined });
    }
  }

  protected handleDocumentNumberInput(event: Event): void {
    if (!(event instanceof CustomEvent)) {
      return;
    }

    const documentNumber = typeof event.detail === 'string' ? event.detail : '';
    const inferredDocument = validateSearchDocument(documentNumber);

    if (!this.model.documentType && inferredDocument) {
      this.updateModel({
        documentNumber,
        documentType: inferredDocument.documentType,
        nationality: AUTO_SPAIN_DOCUMENT_TYPES.includes(inferredDocument.documentType)
          ? this.findSpainOptionValue()
          : undefined,
      });
      return;
    }

    this.updateModel({
      documentNumber,
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
      invalidNie: 'tuCliente.personalData.errors.invalidNie',
      invalidNrt: 'tuCliente.personalData.errors.invalidNrt',
      invalidPassport: 'tuCliente.personalData.errors.invalidPassport',
    };

    return messages[error] ?? '';
  }

  /** Obtiene España del catálogo mock usando su código estable. */
  private findSpainOptionValue(): string | undefined {
    return this.options.nationalities.find((option) => option.value === SPAIN_CODE)?.value;
  }
}
