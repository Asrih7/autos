import { Injectable, signal } from "@angular/core";
import { PrecioCoberturasPageState } from "../models/precio-coberturas.model";

@Injectable({ providedIn: 'root' })
export class PrecioCoberturasStateService {
  private readonly STORAGE_KEY = 'mnv_autos_precio_coberturas_state';

  readonly estado = signal<PrecioCoberturasPageState | null>(null);

  obtenerEstado(): PrecioCoberturasPageState | null {
    const rawState = sessionStorage.getItem(this.STORAGE_KEY);

    if (!rawState) {
      this.estado.set(null);
      return null;
    }

    const parsedState = JSON.parse(rawState) as PrecioCoberturasPageState;
    this.estado.set(parsedState);

    return parsedState;
  }

  guardarEstado(estado: PrecioCoberturasPageState): void {
    this.estado.set(estado);
    sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(estado));
  }

  limpiarEstado(): void {
    this.estado.set(null);
    sessionStorage.removeItem(this.STORAGE_KEY);
  }
}
