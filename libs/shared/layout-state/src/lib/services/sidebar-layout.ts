import { Injectable, Signal, computed, signal } from '@angular/core';
import { TimelineItem } from '@helvetia-lib/helvetia-ng-core-lib';

export interface SidebarStep {
  label: string;
  bloqueado: boolean;
  activo: boolean;
  completado: boolean;
  subSteps?: string[];
}

@Injectable({
  providedIn: 'root',
})
export class SidebarLayout {
  private readonly _steps = signal<SidebarStep[]>([]);
  readonly steps: Signal<SidebarStep[]> = this._steps.asReadonly();
  readonly helvItems: Signal<TimelineItem[]> = computed(() =>
    this._steps().map((s) => new TimelineItem(s.label, s.bloqueado, s.activo)),
  );

  constructor() {
    this.initializeGlobalMenu();
  }

  private initializeGlobalMenu(): void {
    this._steps.set([
      { label: 'Tu cliente',         bloqueado: false, activo: true,  completado: false },
      { label: 'Vehículos',          bloqueado: false, activo: false, completado: false },
      {
        label: 'Conductores',
        bloqueado: false,
        activo: false,
        completado: false,
        subSteps: [
          'Usos del vehículo',
          'Intervinientes',
          'Dirección del propietario',
        ],
      },
      { label: 'Precio y coberturas', bloqueado: false, activo: false, completado: false },
      { label: 'Contratación',        bloqueado: false, activo: false, completado: false },
    ]);
  }

  setActiveStep(label: string): void {
    this._steps.update((steps) =>
      steps.map((s) => ({ ...s, activo: s.label === label })),
    );
  }

  setActiveSubStep(parent: string, _sub: string): void {
    this._steps.update((steps) =>
      steps.map((s) => ({ ...s, activo: s.label === parent })),
    );
  }
}
