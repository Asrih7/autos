import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  input,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  DATOS_PERSONA_OPTIONS_API,
  type DatosPersonaOptions,
} from './data-access/datos-persona-options.api';
import {
  parseDocumentType,
  validateDocumentNumber,
  type DocumentNumberValidationError,
  type DocumentType,
} from './validation/document-number.validator';

const EMPTY_OPTIONS: DatosPersonaOptions = {
  documentTypes: [],
  nationalities: [],
};

const DOCUMENT_NUMBER_ERROR_MESSAGES: Readonly<Record<DocumentNumberValidationError, string>> = {
  documentTypeRequired: 'Selecciona primero el tipo de documento',
  required: 'Introduce el número de documento',
  invalidDni: 'Introduce un DNI válido con ocho números y su letra de control',
  invalidNif: 'Introduce un NIF de persona jurídica válido',
  invalidCif: 'Introduce un CIF válido',
  invalidPassport: 'Introduce un pasaporte válido de entre seis y nueve caracteres',
};

export const DATOS_PERSONA_DEFAULT_LABELS = {
  title: 'Datos personales',
  firstNameLabel: 'Nombre*',
  firstSurnameLabel: 'Primer apellido*',
  secondSurnameLabel: 'Segundo apellido*',
  businessNameLabel: 'Razón social*',
  documentTypeLabel: 'Tipo de documento*',
  documentNumberLabel: 'Número de documento*',
  nationalityLabel: 'Nacionalidad*',
  beneficiaryLabel: 'El beneficiario de los daños y de la garantía de ocupantes sea el mismo',
} as const;

@Component({
  selector: 'app-datos-persona',
  imports: [],
  templateUrl: './datos-persona.component.html',
  styleUrl: './datos-persona.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DatosPersona {
  private readonly optionsApi = inject(DATOS_PERSONA_OPTIONS_API);
  private readonly documentNumberTouched = signal(false);
  private readonly nationalityTouched = signal(false);

  protected readonly selectedDocumentType = signal<DocumentType | undefined>(undefined);
  protected readonly selectedNationality = signal<string | undefined>(undefined);
  protected readonly documentNumber = signal('');

  readonly title = input(DATOS_PERSONA_DEFAULT_LABELS.title);
  readonly firstNameLabel = input(DATOS_PERSONA_DEFAULT_LABELS.firstNameLabel);
  readonly firstSurnameLabel = input(DATOS_PERSONA_DEFAULT_LABELS.firstSurnameLabel);
  readonly secondSurnameLabel = input(DATOS_PERSONA_DEFAULT_LABELS.secondSurnameLabel);
  readonly businessNameLabel = input(DATOS_PERSONA_DEFAULT_LABELS.businessNameLabel);
  readonly documentTypeLabel = input(DATOS_PERSONA_DEFAULT_LABELS.documentTypeLabel);
  readonly documentNumberLabel = input(DATOS_PERSONA_DEFAULT_LABELS.documentNumberLabel);
  readonly nationalityLabel = input(DATOS_PERSONA_DEFAULT_LABELS.nationalityLabel);
  readonly beneficiaryLabel = input(DATOS_PERSONA_DEFAULT_LABELS.beneficiaryLabel);

  protected readonly options = toSignal(this.optionsApi.getOptions(), {
    initialValue: EMPTY_OPTIONS,
  });

  protected readonly documentNumberError = computed(() => {
    if (!this.documentNumberTouched()) {
      return null;
    }

    return validateDocumentNumber(this.selectedDocumentType(), this.documentNumber());
  });

  protected readonly documentNumberInvalid = computed(() => this.documentNumberError() !== null);
  protected readonly nationalityInvalid = computed(
    () => this.nationalityTouched() && this.selectedNationality() === undefined,
  );
  protected readonly isCifSelected = computed(() => this.selectedDocumentType() === 'cif');

  protected readonly documentNumberErrorMessage = computed(() => {
    const error = this.documentNumberError();
    return error ? DOCUMENT_NUMBER_ERROR_MESSAGES[error] : '';
  });

  protected handleDocumentTypeChange(event: Event): void {
    if (!(event instanceof CustomEvent)) {
      return;
    }

    this.selectedDocumentType.set(parseDocumentType(event.detail));
  }

  protected handleDocumentNumberInput(event: Event): void {
    if (!(event instanceof CustomEvent)) {
      return;
    }

    this.documentNumber.set(typeof event.detail === 'string' ? event.detail : '');
  }

  protected handleDocumentNumberBlur(): void {
    this.documentNumberTouched.set(true);
  }

  protected handleNationalityInput(): void {
    this.selectedNationality.set(undefined);
  }

  protected handleNationalityChange(event: Event): void {
    if (!(event instanceof CustomEvent) || typeof event.detail !== 'string') {
      this.selectedNationality.set(undefined);
      return;
    }

    const isValidNationality = this.options().nationalities.some(
      (option) => option.value === event.detail,
    );

    this.selectedNationality.set(isValidNationality ? event.detail : undefined);
  }

  protected handleNationalityBlur(): void {
    this.nationalityTouched.set(true);
  }
}
