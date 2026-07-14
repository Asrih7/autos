import { Injectable, signal, computed, effect } from "@angular/core";
import {
  BrandModelSummary,
  Marca,
  Modelo,
  Vehiculo,
  Version,
} from "../models/vehiculo.models";

export interface VehiculoGlobalState {
  matriculaOBastidor: string | null;
  metodoBusqueda: "matricula" | "bastidor" | null;

  vehiculoData: Partial<Vehiculo>;
}

@Injectable({ providedIn: "root" })
export class VehiculoStateService {
  private readonly STORAGE_KEY = "mnv_autos_vehiculo_state";

  private readonly _state = signal<VehiculoGlobalState>(
    this.loadInitialState(),
  );
  readonly state = this._state.asReadonly();

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

  constructor() {
    effect(() => {
      try {
        sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._state()));
      } catch (err) {
        console.error(
          "Error al guardar el estado del vehículo en la sesión:",
          err,
        );
      }
    });
  }

  saveMatriculaOBastidor(
    metodo: "matricula" | "bastidor",
    valor: string,
  ): void {
    this._state.update((current) => ({
      ...current,
      metodoBusqueda: metodo,
      matriculaOBastidor: valor,
    }));
  }

  saveMarca(marca: Marca): void {
    this._state.update((current) => ({
      ...current,
      vehiculoData: {
        ...current.vehiculoData,
        marca: marca,
      },
    }));
  }

  saveModelo(modelo: Modelo): void {
    this._state.update((current) => ({
      ...current,
      vehiculoData: {
        ...current.vehiculoData,
        modelo: modelo,
      },
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

  saveVersionSeleccionada(version: Version): void {
    this._state.update((current) => ({
      ...current,
      vehiculoData: {
        ...current.vehiculoData,
        version: version,
      },
    }));
  }

  saveRestoCampos(
    campos: Partial<Omit<Vehiculo, "marca" | "modelo" | "version">>,
  ): void {
    this._state.update((current) => ({
      ...current,
      vehiculoData: {
        ...current.vehiculoData,
        ...campos,
      },
    }));
  }

  resetState(): void {
    sessionStorage.removeItem(this.STORAGE_KEY);
    this._state.set({
      matriculaOBastidor: null,
      metodoBusqueda: null,
      vehiculoData: {},
    });
  }

  private loadInitialState(): VehiculoGlobalState {
    try {
      const cachedString = sessionStorage.getItem(this.STORAGE_KEY);
      if (cachedString) {
        return JSON.parse(cachedString) as VehiculoGlobalState;
      }
    } catch (err) {
      console.error("Error al decodificar la sesión previa del vehículo:", err);
    }

    return {
      matriculaOBastidor: null,
      metodoBusqueda: null,
      vehiculoData: {},
    };
  }
}
