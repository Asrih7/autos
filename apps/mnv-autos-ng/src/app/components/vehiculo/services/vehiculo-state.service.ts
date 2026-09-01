import { Injectable, signal, computed, effect, inject } from "@angular/core";
import {
  BrandModelSummary,
  Marca,
  Modelo,
  RestoCamposModel,
  Vehiculo,
  VersionVehiculo,
  AccesoriosAdicionales,
  MetodoBusqueda,
  CarroceriaOption,
} from "../models/vehiculo.models";
import { VehiculoHttpService } from "./vehiculo-http.service";
import {
  mapToVehiculoDomain,
  mapToVersionesCatalogDomain,
} from "../mappers/vehiculo.mapper";
import { HttpErrorResponse } from "@angular/common/http";

export interface VehiculoGlobalState {
  matriculaOBastidor: "MANUAL_SEARCH_ACTIVE" | string | null;
  metodoBusqueda: MetodoBusqueda | null;
  vehiculoData: Partial<Vehiculo>;
  loading: boolean;
  loadingModelos: boolean;
  loadingVersiones: boolean;
  loadingCarrocerias: boolean;
  loadingAccesorios: boolean;
  error: string | null;
  busquedaExitosa: boolean;
  marcasCatalog: Marca[];
  modelosCatalog: Modelo[];
  versionMasContratada: string | null;
  versionesCatalog: VersionVehiculo[];
  carroceriasCatalog: CarroceriaOption[];
  accesoriosCatalog: AccesoriosAdicionales[];
}

@Injectable({ providedIn: "root" })
export class VehiculoStateService {
  private readonly httpService = inject(VehiculoHttpService);
  private readonly STORAGE_KEY = "mnv_autos_vehiculo_state";

  // 1. STATE DECLARATIONS
  private readonly _state = signal<VehiculoGlobalState>(
    this.loadInitialState(),
  );
  readonly state = this._state.asReadonly();

  // 2. SELECTORS (LOADING STATUS)
  readonly loading = computed(() => this._state().loading);
  readonly loadingModelos = computed(() => this._state().loadingModelos);
  readonly loadingVersiones = computed(() => this._state().loadingVersiones);
  readonly loadingCarrocerias = computed(
    () => this._state().loadingCarrocerias,
  );
  readonly loadingAccesorios = computed(() => this._state().loadingAccesorios);
  readonly error = computed(() => this._state().error);
  readonly busquedaExitosa = computed(() => this._state().busquedaExitosa);

  // 3. SELECTORS (CATALOGS & DATA)
  readonly marcas = computed(() => this._state().marcasCatalog);
  readonly modelos = computed(() => this._state().modelosCatalog);
  readonly versionesRaw = computed(() => this._state().versionesCatalog);
  readonly carrocerias = computed(() => this._state().carroceriasCatalog);
  readonly accesoriosRaw = computed(() => this._state().accesoriosCatalog);
  readonly selectedVehiculo = computed(() => this._state().vehiculoData);

  readonly selectedBrandAndModel = computed<BrandModelSummary>(() => {
    const current = this._state().vehiculoData;
    return {
      marca: current.marca ?? { id: "", nombre: "", logo: "" },
      modelo: current.modelo ?? { id: "", nombre: "" },
    };
  });

  readonly nombreVehiculoCompleto = computed<string>(() => {
    const current = this._state().vehiculoData;
    if (!current.marca?.nombre && !current.modelo?.nombre) {
      return "Vehículo no seleccionado";
    }
    return `${current.marca?.nombre ?? ""} ${current.modelo?.nombre ?? ""}`.trim();
  });

  // 4. LIFECYCLE & SYNC EFFECTS
  constructor() {
    effect(() => {
      try {
        const currentState = this.state();
        const {
          loading,
          loadingModelos,
          loadingVersiones,
          loadingCarrocerias,
          loadingAccesorios,
          error,
          busquedaExitosa,
          marcasCatalog,
          modelosCatalog,
          versionesCatalog,
          carroceriasCatalog,
          accesoriosCatalog,
          ...stateToPersist
        } = currentState;

        sessionStorage.setItem(
          this.STORAGE_KEY,
          JSON.stringify(stateToPersist),
        );
      } catch (err) {
        console.error("Error saving vehicle state to session storage:", err);
      }
    });
  }

  // 5. ASYNCHRONOUS API LOAD ACTIONS
  buscarVehiculoPorApi(metodo: MetodoBusqueda, valor: string): void {
    this._state.update((s) => ({
      ...s,
      metodoBusqueda: metodo,
      matriculaOBastidor: valor,
      loading: true,
      error: null,
      busquedaExitosa: false,
    }));

    this.httpService.buscarPorMatriculaOBastidor(metodo, valor).subscribe({
      next: (dtoResponse) => {
        try {
          const mappedVehiculo = mapToVehiculoDomain(dtoResponse);
          const mappedVersiones = mapToVersionesCatalogDomain(dtoResponse);

          this._state.update((s) => ({
            ...s,
            vehiculoData: mappedVehiculo,
            marcasCatalog: mappedVehiculo.marca ? [mappedVehiculo.marca] : [],
            modelosCatalog: mappedVehiculo.modelo
              ? [mappedVehiculo.modelo]
              : [],
            versionesCatalog: mappedVersiones,
            loading: false,
            busquedaExitosa: true,
          }));
        } catch (err: any) {
          this._state.update((s) => ({
            ...s,
            loading: false,
            error: err.message,
          }));
        }
      },
      error: (err) =>
        this._state.update((s) => ({
          ...s,
          loading: false,
          error: err.message,
        })),
    });
  }

  loadMarcasCatalog(): void {
    if (
      this._state().vehiculoData?.marca?.id &&
      this._state().marcasCatalog.length > 0
    )
      return;

    this._state.update((s) => ({ ...s, loading: true }));
    this.httpService.getMarcas().subscribe({
      next: (marcas) =>
        this._state.update((s) => ({
          ...s,
          marcasCatalog: marcas,
          loading: false,
        })),
      error: (err) =>
        this._state.update((s) => ({
          ...s,
          error: err.message,
          loading: false,
        })),
    });
  }

  loadModelosCatalog(marcaId: string): void {
    if (this._state().loadingModelos) return;

    if (
      this._state().modelosCatalog.length > 0 &&
      this._state().vehiculoData?.marca?.id === marcaId
    )
      return;

    this._state.update((s) => ({
      ...s,
      loadingModelos: true,
      modelosCatalog: [],
    }));

    this.httpService.getModelosPorMarca(marcaId).subscribe({
      next: (modelos) =>
        this._state.update((s) => ({
          ...s,
          modelosCatalog: modelos,
          loadingModelos: false,
        })),
      error: (err) =>
        this._state.update((s) => ({
          ...s,
          error: err.message,
          loadingModelos: false,
        })),
    });
  }

  loadVersionesCatalog(modeloId: string): void {
    if (this._state().loadingVersiones) return;

    this._state.update((s) => ({
      ...s,
      loadingVersiones: true,
      versionesCatalog: [],
      versionMasContratada: null 
    }));

    this.httpService.getVersionesPorModelo(modeloId).subscribe({
      next: (payload) =>
        this._state.update((s) => ({
          ...s,
          versionesCatalog: payload.versiones,
          versionMasContratada: payload.versionMasContratada,
          loadingVersiones: false,
        })),
      error: (err) =>
        this._state.update((s) => ({
          ...s,
          error: err.message,
          loadingVersiones: false,
        })),
    });
  }

  loadCarroceriasCatalog(tipoVehiculo: string): void {
    if (this._state().loadingCarrocerias) return;
    if (this._state().carroceriasCatalog.length > 0) return;

    this._state.update((s) => ({
      ...s,
      loadingCarrocerias: true,
      error: null,
    }));

    const vehiculoData = this._state().vehiculoData;
    const tipoVehiculoNum = parseInt(
      tipoVehiculo || "0",
      10,
    );
    const codigoActividadNum = parseInt(
      vehiculoData?.codigoActividad || "0",
      10,
    );

    this.httpService
      .getOpcionesCarroceria(tipoVehiculoNum, codigoActividadNum)
      .subscribe({
        next: (carrocerias) => {
          this._state.update((s) => ({
            ...s,
            carroceriasCatalog: carrocerias,
            loadingCarrocerias: false,
            error: null,
          }));
        },
        error: (err: unknown) => {
          if (err instanceof HttpErrorResponse && err.status === 400) {
            console.warn(
              "Backend returned 400 Bad Request. Intercepting and hiding field per user requirements.",
            );

            this._state.update((s) => ({
              ...s,
              carroceriasCatalog: [],
              loadingCarrocerias: false,
              error: null,
            }));
            return;
          }

          this._state.update((s) => ({
            ...s,
            error:
              err instanceof Error ? err.message : "Error loading body styles",
            loadingCarrocerias: false,
            carroceriasCatalog: [],
          }));
        },
      });
  }

  loadAccesoriosCatalog(versionId: string): void {
    if (this._state().loadingAccesorios) return;
    if (!versionId || versionId.trim().length === 0) return;

    this._state.update((s) => ({
      ...s,
      loadingAccesorios: true,
      accesoriosCatalog: [],
      error: null,
    }));

    this.httpService.getAccesoriosPorVehiculo(versionId).subscribe({
      next: (accesorios) => {
        this._state.update((s) => ({
          ...s,
          accesoriosCatalog: accesorios,
          loadingAccesorios: false,
          error: null,
        }));
      },
      error: (err: unknown) => {
        if (err instanceof HttpErrorResponse && err.status === 400) {
          console.warn(
            "Backend returned 400 for accessories. Intercepting and passing empty array.",
          );

          this._state.update((s) => ({
            ...s,
            accesoriosCatalog: [],
            loadingAccesorios: false,
            error: null,
          }));
          return;
        }

        this._state.update((s) => ({
          ...s,
          error:
            err instanceof Error
              ? err.message
              : "Error loading accessories catalog",
          loadingAccesorios: false,
          accesoriosCatalog: [],
        }));
      },
    });
  }

  // 6. LOCAL STATE MUTATIONS (SAVE ACTIONS)
  clearBusquedaExitosa(): void {
    this._state.update((s) => ({ ...s, busquedaExitosa: false }));
  }

  saveMatriculaOBastidor(metodo: MetodoBusqueda, valor: string): void {
    this._state.update((current) => ({
      ...current,
      metodoBusqueda: metodo,
      matriculaOBastidor: valor,
    }));
  }

  saveMarca(marca: Marca): void {
    this._state.update((s) => ({
      ...s,
      vehiculoData: {
        marca,
        modelo: undefined,
        version: undefined,
        restoCampos: undefined,
      },
      modelosCatalog: [],
      versionesCatalog: [],
      busquedaExitosa: false,
    }));
  }

  saveModelo(modelo: Modelo): void {
    this._state.update((s) => {
      const clearCatalog = s.matriculaOBastidor === 'MANUAL_SEARCH_ACTIVE';

      return {
        ...s,
        vehiculoData: { 
          ...s.vehiculoData, 
          modelo, 
          version: undefined,
          restoCampos: undefined 
        },
        versionesCatalog: clearCatalog ? [] : s.versionesCatalog,
        busquedaExitosa: false, 
      };
    });

    if (modelo?.id) {
      this.loadVersionesCatalog(modelo.id);
    }
  }

  saveBrandAndModel(data: BrandModelSummary): void {
    this._state.update((current) => ({
      ...current,
      vehiculoData: {
        ...current.vehiculoData,
        marca: data.marca,
        modelo: data.modelo,
      },
    }));
  }

  saveVersionSeleccionada(version: VersionVehiculo): void {
    this._state.update((current) => ({
      ...current,
      vehiculoData: { ...current.vehiculoData, version },
    }));

    if (version.id) {
      this.loadCarroceriasCatalog(version.tipoVehiculo);
    }
  }

  saveRestoCampos(campos: RestoCamposModel): void {
    this._state.update((current) => ({
      ...current,
      vehiculoData: {
        ...current.vehiculoData,
        restoCampos: { ...campos },
      },
    }));
  }

  saveAccesoriosData(
    tieneAccesoriosSeries: boolean,
    accesorios: AccesoriosAdicionales[],
  ): void {
    this._state.update((current) => ({
      ...current,
      vehiculoData: {
        ...current.vehiculoData,
        tieneAccesoriosSeries,
        accesoriosAdicionales: [...accesorios],
      },
    }));
  }

  // 7. INFRASTRUCTURE & CACHE RESET HANDLERS
  prepareForManualSearch(): void {
    this._state.update((s) => ({
      ...s,
      vehiculoData: {},
      marcasCatalog: [],
      modelosCatalog: [],
      versionesCatalog: [],
      busquedaExitosa: false,
    }));

    this.loadMarcasCatalog();
  }

  private loadInitialState(): VehiculoGlobalState {
    const defaultState: VehiculoGlobalState = {
      matriculaOBastidor: null,
      metodoBusqueda: null,
      vehiculoData: {},
      loading: false,
      loadingModelos: false,
      loadingVersiones: false,
      loadingCarrocerias: false,
      loadingAccesorios: false,
      error: null,
      busquedaExitosa: false,
      marcasCatalog: [],
      modelosCatalog: [],
      versionMasContratada: null,
      versionesCatalog: [],
      carroceriasCatalog: [],
      accesoriosCatalog: [],
    };

    try {
      const cachedString = sessionStorage.getItem(this.STORAGE_KEY);
      if (!cachedString) return defaultState;

      const parsedStorage = JSON.parse(cachedString);
      const restoredVehiculo = parsedStorage.vehiculoData || {};

      const initialMarcas = restoredVehiculo.marca
        ? [restoredVehiculo.marca]
        : [];
      const initialModelos = restoredVehiculo.modelo
        ? [restoredVehiculo.modelo]
        : [];
      const initialVersiones = restoredVehiculo.version
        ? [restoredVehiculo.version]
        : [];

      return {
        ...defaultState,
        ...parsedStorage,
        marcasCatalog: initialMarcas,
        modelosCatalog: initialModelos,
        versionesCatalog: initialVersiones,
      };
    } catch (err) {
      console.error(
        "Failed to restore initial state from sessionStorage:",
        err,
      );
      return defaultState;
    }
  }
}
