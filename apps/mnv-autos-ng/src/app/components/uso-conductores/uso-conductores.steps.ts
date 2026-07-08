import { StepDefinition } from './uso-conductores';

export const USO_CONDUCTORES_STEPS: StepDefinition[] = [
  {
    id: 'uso-vehiculo',
    label: 'Uso del vehículo',
    component: () =>
      import('./steps/uso-vehiculo/uso-vehiculo')
        .then(m => m.UsoVehiculoComponent),
  },
  {
    id: 'intervinientes',
    label: 'Intervinientes',
    component: () =>
      import('./steps/intervinientes/intervinientes')
        .then(m => m.IntervinientesComponent),
  },
  {
    id: 'direccion-tomador',
    label: 'Dirección del tomador',
    component: () =>
      import('./steps/direccion-tomador/direccion-tomador.component')
        .then(m => m.DireccionTomadorComponent),
  },
];
