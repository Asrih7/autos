import { Type } from '@angular/core';

export interface VehiculoStepDefinition {
  id: string;
  label: string;
  component: () => Promise<Type<unknown>>;
}

export const VEHICULO_STEPS: VehiculoStepDefinition[] = [
  {
    id: 'busqueda-matricula',
    label: 'Búsqueda por Matrícula',
    component: () =>
      import('./steps/busqueda-matricula/busqueda-matricula')
        .then(m => m.BusquedaMatricula),
  },
  {
    id: 'busqueda-manual',
    label: 'Búsqueda Manual',
    component: () =>
      import('./steps/busqueda-manual/busqueda-manual')
        .then(m => m.BusquedaManualComponent),
  },
  {
    id: 'confirmacion-version',
    label: 'Confirmación de Versión',
    component: () =>
      import('./steps/confirmacion-version/confirmacion-version')
        .then(m => m.ConfirmacionVersion),
  },
  {
    id: 'resto-campos',
    label: 'Datos Adicionales',
    component: () =>
      import('./steps/resto-campos/resto-campos')
        .then(m => m.RestoCampos),
  },
  {
    id: 'accesorios',
    label: 'Accesorios',
    component: () =>
      import('./steps/accesorios/accesorios')
        .then(m => m.Accesorios),
  },
];
