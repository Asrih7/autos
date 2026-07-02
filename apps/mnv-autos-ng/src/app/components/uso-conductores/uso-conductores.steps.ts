export interface StepDefinition {
  id: string;
  label: string;
  component: () => Promise<any>;
}

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
    id: 'direccion-propietario',
    label: 'Dirección del propietario',
    component: () =>
      import('./steps/direccion-propietario/direccion-propietario')
        .then(m => m.DireccionPropietarioComponent),
  },
];
