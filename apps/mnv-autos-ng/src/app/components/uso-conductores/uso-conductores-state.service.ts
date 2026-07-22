import { computed, effect, Injectable, signal } from "@angular/core";

export interface PersonaState {
  documento: string;
  numeroDocumento: string;
  pais: string;
  fechaNacimiento: string | null;
  tipoCarnet?: string;
  fechaObtencionCarnet: string | null;
  edadObtencionCarnet?: string | number;
}

export interface IntervinientesState {
  tomadorEsPropietario: boolean;
  tomadorEsConductorHabitual: boolean;
  tomador: PersonaState;
  propietario: PersonaState;
  conductorHabitual: PersonaState;
  conductoresOcasionales: PersonaState[];
  propietarioDireccion: { domicilio: string } | null;
}

export interface SeguroAnteriorState {
  seguroSeleccionadoKey: string;
  aseguradoraSeleccionadaId: string | null;
  aseguradoraConfirmada: boolean;
  ultimosDigitosPoliza: string[];
  polizaConfirmada: boolean;
  continuarSinPoliza: boolean;
  aniosAseguradoSeleccionado: string;
  siniestroSeleccionado: string;
  completed: boolean;
}

export interface FechaEfectoSeguroState {
  dia: string;
  mes: string;
  anio: string;
  fechaISO: string | null;
  completed: boolean;
}

export interface UsoConductoresGlobalState {
  usoSelected: string | null;
  usoOtrosSelected: string | null;
  intervinientesCompleted: boolean;
  direccionTomadorCompleted: boolean;
  intervinientes: IntervinientesState;
  seguroAnterior: SeguroAnteriorState;
  fechaEfectoSeguro: FechaEfectoSeguroState;
  lastStepId: string | null;
  stepsLoaded: boolean[];
}

const STEPS_COUNT = 5;

@Injectable({ providedIn: "root" })
export class UsoConductoresStateService {
  private readonly STORAGE_KEY = "mnv_autos_uso_conductores_state";
  private readonly _state = signal<UsoConductoresGlobalState>(
    this.loadInitialState(),
  );

  readonly state = this._state.asReadonly();

  readonly usoSelected = computed(() => this._state().usoSelected);
  readonly usoOtrosSelected = computed(() => this._state().usoOtrosSelected);

  readonly intervinientes = computed(() => this._state().intervinientes);
  readonly intervinientesCompleted = computed(
    () => this._state().intervinientesCompleted,
  );

  readonly direccionTomadorCompleted = computed(
    () => this._state().direccionTomadorCompleted,
  );

  readonly lastStepId = computed(() => this._state().lastStepId);
  readonly stepsLoaded = computed(() => this._state().stepsLoaded);
  readonly seguroAnterior = computed(() => this._state().seguroAnterior);
  readonly fechaEfectoSeguro = computed(() => this._state().fechaEfectoSeguro);

  selectUso(value: string) {
    this._state.update((current) => ({
      ...current,
      usoSelected: value,
      usoOtrosSelected: value === "otros" ? current.usoOtrosSelected : null,
    }));
  }

  selectUsoOtro(value: string) {
    this._state.update((current) => ({
      ...current,
      usoOtrosSelected: value,
    }));
  }

  completeIntervinientes() {
    this._state.update((current) => ({
      ...current,
      intervinientesCompleted: true,
    }));
  }

  resetIntervinientes() {
    this._state.update((current) => ({
      ...current,
      intervinientesCompleted: false,
    }));
  }

  completeDireccionTomador() {
    this._state.update((current) => ({
      ...current,
      direccionTomadorCompleted: true,
    }));
  }

  resetDireccionTomador() {
    this._state.update((current) => ({
      ...current,
      direccionTomadorCompleted: false,
    }));
  }

  updateIntervinientesState(partial: Partial<IntervinientesState>) {
    this._state.update((current) => ({
      ...current,
      intervinientes: {
        ...current.intervinientes,
        ...partial,
      },
    }));
  }

  updateSeguroAnteriorState(partial: Partial<SeguroAnteriorState>) {
    this._state.update((current) => ({
      ...current,
      seguroAnterior: {
        ...current.seguroAnterior,
        ...partial,
      },
    }));
  }

  updateFechaEfectoSeguroState(partial: Partial<FechaEfectoSeguroState>) {
    this._state.update((current) => ({
      ...current,
      fechaEfectoSeguro: {
        ...current.fechaEfectoSeguro,
        ...partial,
      },
    }));
  }

  setLastStep(stepId: string) {
    this._state.update((current) => ({
      ...current,
      lastStepId: stepId,
    }));
  }

  setStepLoaded(index: number) {
    this._state.update((current) => ({
      ...current,
      stepsLoaded: current.stepsLoaded.map((value, currentIndex) =>
        currentIndex === index ? true : value,
      ),
    }));
  }

  clearStepLoaded(index: number) {
    this._state.update((current) => ({
      ...current,
      stepsLoaded: current.stepsLoaded.map((value, currentIndex) =>
        currentIndex === index ? false : value,
      ),
    }));
  }

  readonly canContinueFromUso = computed(() => {
    const uso = this.usoSelected();
    if (!uso) return false;

    if (uso === "otros") {
      return !!this.usoOtrosSelected();
    }

    return true;
  });

  readonly canContinueFromIntervinientes = computed(() =>
    this.intervinientesCompleted(),
  );
  readonly canContinueFromDireccionTomador = computed(() =>
    this.direccionTomadorCompleted(),
  );
  readonly canContinueFromSeguroAnterior = computed(() => {
    const seguro = this.seguroAnterior();

    if (!seguro.seguroSeleccionadoKey) {
      return false;
    }

    if (
      seguro.seguroSeleccionadoKey === "helvetia-caser" ||
      seguro.seguroSeleccionadoKey === "sin-seguro"
    ) {
      return true;
    }

    if (!seguro.aseguradoraSeleccionadaId) {
      return false;
    }

    if (!seguro.aseguradoraConfirmada) {
      return true;
    }

    if (!seguro.polizaConfirmada && !seguro.continuarSinPoliza) {
      return seguro.ultimosDigitosPoliza.every((digito) => digito !== "");
    }

    return seguro.completed;
  });
  readonly canContinueFromFechaEfectoSeguro = computed(
    () => this.fechaEfectoSeguro().completed,
  );

  constructor() {
    effect(() => {
      try {
        sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._state()));
      } catch {
      }
    });
  }

  private loadInitialState(): UsoConductoresGlobalState {
    const defaultState = this.createDefaultState();

    try {
      const cached = sessionStorage.getItem(this.STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as UsoConductoresGlobalState;
        const stepsLoaded =
          Array.isArray(parsed.stepsLoaded) &&
          parsed.stepsLoaded.length === STEPS_COUNT
            ? parsed.stepsLoaded
            : new Array(STEPS_COUNT).fill(false);

        return {
          ...defaultState,
          ...parsed,
          stepsLoaded,
          intervinientes: {
            ...defaultState.intervinientes,
            ...parsed.intervinientes,
          },
          seguroAnterior: {
            ...defaultState.seguroAnterior,
            ...parsed.seguroAnterior,
          },
          fechaEfectoSeguro: {
            ...defaultState.fechaEfectoSeguro,
            ...parsed.fechaEfectoSeguro,
          },
        };
      }
    } catch {
    }

    return defaultState;
  }

  private createDefaultState(): UsoConductoresGlobalState {
    return {
      usoSelected: null,
      usoOtrosSelected: null,
      intervinientesCompleted: false,
      direccionTomadorCompleted: false,
      lastStepId: null,
      stepsLoaded: new Array(STEPS_COUNT).fill(false),
      intervinientes: {
        tomadorEsPropietario: true,
        tomadorEsConductorHabitual: true,
        tomador: {
          documento: "NIF",
          numeroDocumento: "",
          pais: "ES",
          fechaNacimiento: null,
          tipoCarnet: "B",
          fechaObtencionCarnet: null,
          edadObtencionCarnet: undefined,
        },
        propietario: {
          documento: "NIF",
          numeroDocumento: "",
          pais: "ES",
          fechaNacimiento: null,
          tipoCarnet: undefined,
          fechaObtencionCarnet: null,
          edadObtencionCarnet: undefined,
        },
        conductorHabitual: {
          documento: "NIF",
          numeroDocumento: "",
          pais: "ES",
          fechaNacimiento: null,
          tipoCarnet: "B",
          fechaObtencionCarnet: null,
          edadObtencionCarnet: undefined,
        },
        conductoresOcasionales: [],
        propietarioDireccion: null,
      },
      seguroAnterior: {
        seguroSeleccionadoKey: "",
        aseguradoraSeleccionadaId: null,
        aseguradoraConfirmada: false,
        ultimosDigitosPoliza: Array(5).fill(""),
        polizaConfirmada: false,
        continuarSinPoliza: false,
        aniosAseguradoSeleccionado: "",
        siniestroSeleccionado: "",
        completed: false,
      },
      fechaEfectoSeguro: {
        dia: "",
        mes: "",
        anio: "",
        fechaISO: null,
        completed: false,
      },
    };
  }
}