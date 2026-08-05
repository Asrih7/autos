import { computed, effect, Injectable, signal } from '@angular/core';
import {
  type ClienteBusquedaResult,
  type DatosPersonaModel,
  DatosDomicilioModel,
  EMPTY_DATOS_DOMICILIO,
} from '@mnv-autos-ng/ui';

export type OperacionTipo = 'cotizacion' | 'precotizacion';

export interface TuClienteGlobalState {
  clientSearchQuery: string;
  clientSearchError: string | null;
  searching: boolean;
  normalizingAddress: boolean;
  addressError: string | null;
  searchAttempted: boolean;
  clientResult: ClienteBusquedaResult | null;
  operationType: OperacionTipo | null;
  editingClient: boolean;
  showPersonalDataStep: boolean;
  showAddressStep: boolean;
  showBirthdateStep: boolean;
  datosPersona: DatosPersonaModel;
  direccion: DatosDomicilioModel;
  birthDate?: string;
}

const STORAGE_KEY = 'mnv_autos_tu_cliente_state';

@Injectable({ providedIn: 'root' })
export class TuClienteStateService {
  private readonly _state = signal<TuClienteGlobalState>(this.loadInitialState());
  readonly state = this._state.asReadonly();

  readonly clientSearchQuery = computed(() => this._state().clientSearchQuery);
  readonly clientSearchError = computed(() => this._state().clientSearchError);
  readonly searching = computed(() => this._state().searching);
  readonly normalizingAddress = computed(() => this._state().normalizingAddress);
  readonly addressError = computed(() => this._state().addressError);
  readonly searchAttempted = computed(() => this._state().searchAttempted);
  readonly clientResult = computed(() => this._state().clientResult);
  readonly operationType = computed(() => this._state().operationType);
  readonly editingClient = computed(() => this._state().editingClient);
  readonly showPersonalDataStep = computed(() => this._state().showPersonalDataStep);
  readonly showAddressStep = computed(() => this._state().showAddressStep);
  readonly showBirthdateStep = computed(() => this._state().showBirthdateStep);
  readonly datosPersona = computed(() => this._state().datosPersona);
  readonly direccion = computed(() => this._state().direccion);
  readonly birthDate = computed(() => this._state().birthDate);

  readonly clientNotFound = computed(
    () =>
      !this.clientResult() &&
      !this.clientSearchError() &&
      this.searchAttempted() &&
      this.clientSearchQuery().trim().length > 0,
  );

  readonly canContinue = computed(() => {
    const state = this._state();
    if (!state.showBirthdateStep) {
      return false;
    }

    const persona = state.datosPersona;
    const direccion = state.direccion;

    const hasDocument = Boolean(
      persona.documentType && persona.documentNumber?.trim(),
    );

    const hasPersonalData =
      persona.documentType === 'cif'
        ? Boolean(persona.businessName?.trim() && persona.nationality)
        : Boolean(
            persona.nationality &&
              persona.firstName?.trim() &&
              persona.firstSurname?.trim() &&
              persona.secondSurname?.trim(),
          );

    const hasAddress = Boolean(
      direccion.tipoVia?.trim() &&
        direccion.nombreVia?.trim() &&
        direccion.numero?.trim() &&
        direccion.codigoPostal?.trim() &&
        direccion.provincia?.trim() &&
        direccion.localidad?.trim(),
    );

    return Boolean(state.birthDate) && hasDocument && hasPersonalData && hasAddress;
  });

  constructor() {
    effect(() => {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this._state()));
      } catch {
        // ignore storage failures
      }
    });
  }

  setClientSearchQuery(value: string): void {
    this._state.update((current: TuClienteGlobalState) => ({
      ...current,
      clientSearchQuery: value,
      clientSearchError: null,
      searchAttempted: false,
      clientResult: null,
      operationType: null,
      editingClient: false,
      showPersonalDataStep: false,
      showAddressStep: false,
      showBirthdateStep: false,
      datosPersona: this.emptyDatosPersona(),
      direccion: { ...EMPTY_DATOS_DOMICILIO },
      birthDate: undefined,
      addressError: null,
    }));
  }

  setSearchAttempted(value: boolean): void {
    this._state.update((current: TuClienteGlobalState) => ({
      ...current,
      searchAttempted: value,
    }));
  }

  setClientSearchError(value: string | null): void {
    this._state.update((current: TuClienteGlobalState) => ({
      ...current,
      clientSearchError: value,
    }));
  }

  setSearching(value: boolean): void {
    this._state.update((current: TuClienteGlobalState) => ({
      ...current,
      searching: value,
    }));
  }

  setClientResult(result: ClienteBusquedaResult | null): void {
    this._state.update((current: TuClienteGlobalState) => ({
      ...current,
      clientResult: result,
      operationType: null,
      editingClient: false,
      showPersonalDataStep: false,
      showAddressStep: false,
      showBirthdateStep: false,
    }));

    if (result) {
      this.fillDatosPersonaFromClient(result);
    } else {
      this.resetDatosPersona();
    }
  }

  startOperacion(type: OperacionTipo): boolean {
    const clientResult = this.clientResult();

    this._state.update((current: TuClienteGlobalState) => ({
      ...current,
      operationType: type,
      editingClient: false,
      showPersonalDataStep: !clientResult,
      showAddressStep: false,
      showBirthdateStep: false,
    }));

    return Boolean(clientResult);
  }

  handleEdit(): void {
  this._state.update((current: TuClienteGlobalState) => ({
    ...current,
    editingClient: true,
    showPersonalDataStep: true,
    showAddressStep: true,
    showBirthdateStep: true,
  }));
}


  setDatosPersona(model: DatosPersonaModel): void {
    this._state.update((current: TuClienteGlobalState) => ({
      ...current,
      datosPersona: model,
    }));
  }

  confirmDatosPersona(): void {
    const state = this._state();

    if (state.editingClient && state.clientResult) {
      this._state.update((current: TuClienteGlobalState) => ({
        ...current,
        clientResult: {
          ...current.clientResult!,
          name: this.getDisplayName(current.datosPersona),
          documentType: current.datosPersona.documentType
            ? current.datosPersona.documentType.toUpperCase()
            : current.clientResult?.documentType ?? '',
          documentNumber: current.datosPersona.documentNumber,
          nationality: current.datosPersona.nationality ?? current.clientResult?.nationality ?? '',
        },
        editingClient: false,
        showPersonalDataStep: false,
        showAddressStep: false,
        showBirthdateStep: false,
      }));
      return;
    }

    this._state.update((current: TuClienteGlobalState) => ({
      ...current,
      showPersonalDataStep: false,
      showAddressStep: true,
      showBirthdateStep: false,
    }));
  }

  setDireccion(value: DatosDomicilioModel): void {
    this._state.update((current: TuClienteGlobalState) => ({
      ...current,
      direccion: value,
      addressError: null,
    }));
  }

  confirmDireccion(): void {
    this._state.update((current: TuClienteGlobalState) => ({
      ...current,
      showBirthdateStep: true,
    }));
  }

  setNormalizingAddress(value: boolean): void {
    this._state.update((current) => ({ ...current, normalizingAddress: value }));
  }

  setAddressError(value: string | null): void {
    this._state.update((current) => ({ ...current, addressError: value }));
  }

  setBirthDate(value: string | undefined): void {
    this._state.update((current: TuClienteGlobalState) => ({
      ...current,
      birthDate: value,
    }));
  }

  private fillDatosPersonaFromClient(client: ClienteBusquedaResult): void {
    const { firstName, firstSurname, secondSurname, businessName } = this.parseClientName(client.name);

    this._state.update((current: TuClienteGlobalState) => ({
      ...current,
      datosPersona: {
        documentType: client.documentType.toLowerCase() as DatosPersonaModel['documentType'],
        documentNumber: client.documentNumber,
        // FIX: el mapper ahora devuelve '' cuando el tipo de documento no es
        // DNI/NIF/CIF (no se puede asumir España); lo normalizamos a
        // `undefined` para que el formulario lo trate como "sin seleccionar"
        // en vez de como un valor de select válido.
        nationality: client.nationality || undefined,
        firstName,
        firstSurname,
        secondSurname,
        businessName,
        sameBeneficiary: true,
      },
    }));
  }

  private parseClientName(fullName: string): {
    firstName: string;
    firstSurname: string;
    secondSurname: string;
    businessName: string;
  } {
    const trimmed = fullName.trim();
    if (!trimmed) {
      return { firstName: '', firstSurname: '', secondSurname: '', businessName: '' };
    }

    const parts = trimmed.split(/\s+/);
    if (parts.length === 1) {
      return { firstName: parts[0], firstSurname: '', secondSurname: '', businessName: '' };
    }

    if (parts.length === 2) {
      return { firstName: parts[0], firstSurname: parts[1], secondSurname: '', businessName: '' };
    }

    return {
      firstName: parts[0],
      firstSurname: parts[1],
      secondSurname: parts.slice(2).join(' '),
      businessName: '',
    };
  }

  private resetDatosPersona(): void {
    this._state.update((current: TuClienteGlobalState) => ({
      ...current,
      datosPersona: this.emptyDatosPersona(),
    }));
  }

  private getDisplayName(model: DatosPersonaModel): string {
    return model.documentType === 'cif'
      ? model.businessName
      : [model.firstName, model.firstSurname, model.secondSurname]
          .filter(Boolean)
          .join(' ')
          .trim();
  }

  private loadInitialState(): TuClienteGlobalState {
    const defaultState: TuClienteGlobalState = {
      clientSearchQuery: '',
      clientSearchError: null,
      searching: false,
      normalizingAddress: false,
      addressError: null,
      searchAttempted: false,
      clientResult: null,
      operationType: null,
      editingClient: false,
      showPersonalDataStep: false,
      showAddressStep: false,
      showBirthdateStep: false,
      datosPersona: this.emptyDatosPersona(),
      direccion: { ...EMPTY_DATOS_DOMICILIO },
      birthDate: undefined,
    };

    try {
      const cached = sessionStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as Partial<TuClienteGlobalState>;
        return {
          ...defaultState,
          ...parsed,
          datosPersona: {
            ...defaultState.datosPersona,
            ...parsed.datosPersona,
          },
          direccion: {
            ...defaultState.direccion,
            ...parsed.direccion,
          },
        };
      }
    } catch {
      // Ignore cache parsing failures
    }

    return defaultState;
  }

  private emptyDatosPersona(): DatosPersonaModel {
    return {
      documentType: undefined,
      documentNumber: '',
      nationality: undefined,
      firstName: '',
      firstSurname: '',
      secondSurname: '',
      businessName: '',
      sameBeneficiary: true,
    };
  }
}
