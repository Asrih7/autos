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

export interface VehiculoGlobalState {
  matriculaOBastidor: string | null;
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
  versionesCatalog: VersionVehiculo[];
  carroceriasCatalog: CarroceriaOption[];
  accesoriosCatalog: AccesoriosAdicionales[];
}

@Injectable({ providedIn: "root" })
export class VehiculoStateService {
  private readonly httpService = inject(VehiculoHttpService);
  private readonly STORAGE_KEY = "mnv_autos_vehiculo_state";

  // 1. STATE DECLARATIONS
  private readonly _state = signal<VehiculoGlobalState>(this.loadInitialState());
  readonly state = this._state.asReadonly();

  // 2. SELECTORS (LOADING STATUS)
  readonly loading = computed(() => this._state().loading);
  readonly loadingModelos = computed(() => this._state().loadingModelos);
  readonly loadingVersiones = computed(() => this._state().loadingVersiones);
  readonly loadingCarrocerias = computed(() => this._state().loadingCarrocerias);
  readonly loadingAccesorios = computed(() => this._state().loadingAccesorios);
  readonly error = computed(() => this._state().error);
  readonly busquedaExitosa = computed(() => this._state().busquedaExitosa);

  // 3. SELECTORS (CATALOGS & DATA)
  readonly marcas = computed(() => this._state().marcasCatalog);
  readonly modelos = computed(() => this._state().modelosCatalog);
  readonly versionesRaw = computed(() => this._state().versionesCatalog);
  readonly carrocerias = computed(() => this._state().carroceriasCatalog);
  readonly accesoriosRaw = computed(() => this._state().accesoriosCatalog);

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
        const { 
          loading, loadingModelos, loadingVersiones, loadingCarrocerias, loadingAccesorios,
          error, busquedaExitosa, 
          marcasCatalog, modelosCatalog, versionesCatalog, carroceriasCatalog, accesoriosCatalog, 
          ...stateToPersist 
        } = this._state();
        
        sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(stateToPersist));
      } catch (err) {
        console.error("Error saving vehicle state to session storage:", err);
      }
    });
  }

  // 5. ASYNCHRONOUS API LOAD ACTIONS
  buscarVehiculoPorApi(metodo: MetodoBusqueda, valor: string): void {
    this._state.update(s => ({ 
      ...s, 
      metodoBusqueda: metodo,
      matriculaOBastidor: valor,
      loading: true, 
      error: null, 
      busquedaExitosa: false 
    }));

    this.httpService.buscarPorMatriculaOBastidor(metodo, valor).subscribe({
      next: (vehiculoApi) => {
        this._state.update(s => ({ 
          ...s, 
          vehiculoData: vehiculoApi, 
          loading: false, 
          busquedaExitosa: true
        }));
      },
      error: (err) => {
        this._state.update(s => ({ 
          ...s, 
          loading: false, 
          error: err.message || "Error al buscar el vehículo" 
        }));
      }
    });
  }

  loadMarcasCatalog(): void {
    if (this._state().marcasCatalog.length > 0) return;
    this._state.update(s => ({ ...s, loading: true, error: null }));
    const tipoVehiculoStr = this._state().vehiculoData?.clasificacion?.tipoVehiculo || '100';
    const tipoVehiculoNum = parseInt(tipoVehiculoStr, 10) || 100;

    this.httpService.getMarcas(tipoVehiculoNum).subscribe({
      next: (marcas) => {
        this._state.update(s => ({ 
          ...s, 
          marcasCatalog: marcas,
          loading: false 
        }));
      },
      error: (err: Error) => {
        this._state.update(s => ({ 
          ...s, 
          error: err.message,
          loading: false 
        }));
      }
    });
  }


  loadModelosCatalog(marcaId: string): void {
    this._state.update(s => ({ ...s, loadingModelos: true, modelosCatalog: [] }));

    this.httpService.getModelosPorMarca(marcaId).subscribe({
      next: (modelos) => this._state.update(s => ({ ...s, modelosCatalog: modelos, loadingModelos: false })),
      error: (err) => this._state.update(s => ({ ...s, error: err.message, loadingModelos: false }))
    });
  }

  loadVersionesCatalog(modeloId: string): void {
    this._state.update(s => ({ ...s, loadingVersiones: true, versionesCatalog: [] }));
    const tipoVehiculoStr = this._state().vehiculoData?.clasificacion?.tipoVehiculo || '100';
    const tipoVehiculoNum = parseInt(tipoVehiculoStr, 10) || 100;
    this.httpService.getVersionesPorModelo(modeloId, tipoVehiculoNum).subscribe({
      next: (versiones) => {
        this._state.update(s => ({ 
          ...s, 
          versionesCatalog: versiones, 
          loadingVersiones: false 
        }));
      },
      error: (err: Error) => {
        this._state.update(s => ({ 
          ...s, 
          error: err.message, 
          loadingVersiones: false 
        }));
      }
    });
  }

  loadCarroceriasCatalog(): void {
    if (this._state().carroceriasCatalog.length > 0) return;
    this._state.update(s => ({ ...s, loadingCarrocerias: true }));

    const vehiculoData = this._state().vehiculoData;
    const tipoVehiculoStr = vehiculoData?.clasificacion?.tipoVehiculo || '100';
    const codigoActividadStr = vehiculoData?.codigoActividad || '2000';
    const tipoVehiculoNum = parseInt(tipoVehiculoStr, 10) || 100;
    const codigoActividadNum = parseInt(codigoActividadStr, 10) || 2000;

    this.httpService.getOpcionesCarroceria(tipoVehiculoNum, codigoActividadNum).subscribe({
      next: (carrocerias) => {
        this._state.update(s => ({ 
          ...s, 
          carroceriasCatalog: carrocerias, 
          loadingCarrocerias: false 
        }));
      },
      error: (err: Error) => {
        this._state.update(s => ({ 
          ...s, 
          error: err.message, 
          loadingCarrocerias: false 
        }));
      }
    });
  }

  loadAccesoriosCatalog(versionId: string): void {
    if (!versionId || versionId.trim().length === 0) return;

    this._state.update(s => ({ ...s, loadingAccesorios: true, accesoriosCatalog: [] }));

    this.httpService.getAccesoriosPorVehiculo(versionId).subscribe({
      next: (accesorios) => {
        this._state.update(s => ({ 
          ...s, 
          accesoriosCatalog: accesorios, 
          loadingAccesorios: false 
        }));
      },
      error: (err: Error) => {
        this._state.update(s => ({ 
          ...s, 
          error: err.message, 
          loadingAccesorios: false 
        }));
      }
    });
  }



  // 6. LOCAL STATE MUTATIONS (SAVE ACTIONS)
  clearBusquedaExitosa(): void {
    this._state.update(s => ({ ...s, busquedaExitosa: false }));
  }

  saveMatriculaOBastidor(metodo: MetodoBusqueda, valor: string): void {
    this._state.update((current) => ({
      ...current,
      metodoBusqueda: metodo,
      matriculaOBastidor: valor
    }));
  }

  saveMarca(marca: Marca): void {
    this._state.update((current) => ({
      ...current,
      vehiculoData: { ...current.vehiculoData, marca, modelo: undefined },
    }));
  }

  saveModelo(modelo: Modelo): void {
    this._state.update((current) => ({
      ...current,
      vehiculoData: { ...current.vehiculoData, modelo },
    }));
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

  saveAccesoriosData(tieneAccesoriosSeries: boolean, accesorios: AccesoriosAdicionales[]): void {
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
  resetState(): void {
    sessionStorage.removeItem(this.STORAGE_KEY);
    this._state.set({
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
      versionesCatalog: [],
      carroceriasCatalog: [],
      accesoriosCatalog: []
    });
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
      versionesCatalog: [],
      carroceriasCatalog: [],
      accesoriosCatalog: []
    };
    try {
      const cachedString = sessionStorage.getItem(this.STORAGE_KEY);
      if (cachedString) return { ...defaultState, ...JSON.parse(cachedString) };
    } catch {
      return defaultState;
    }
    return defaultState;
  }
}
