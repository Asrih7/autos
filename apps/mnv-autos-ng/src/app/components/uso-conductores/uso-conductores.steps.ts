import { StepDefinition } from "./uso-conductores.component";

export const USO_CONDUCTORES_STEPS: StepDefinition[] = [
  {
    id: "uso-vehiculo",
    label: "Uso del vehículo",
    component: () =>
      import("./steps/uso-vehiculo/uso-vehiculo.component").then(
        (m) => m.UsoVehiculoComponent,
      ),
  },
  {
    id: "intervinientes",
    label: "Intervinientes",
    component: () =>
      import("./steps/intervinientes/intervinientes.component").then(
        (m) => m.IntervinientesComponent,
      ),
  },
  {
    id: "direccion-tomador",
    label: "Dirección del tomador",
    component: () =>
      import("./steps/direccion-tomador/direccion-tomador.component").then(
        (m) => m.DireccionTomadorComponent,
      ),
  },
  {
    id: "seguro-anterior",
    label: "Seguro anterior",
    component: () =>
      import("./steps/seguro-anterior/seguro-anterior.component").then(
        (m) => m.SeguroAnteriorComponent,
      ),
  },
  {
    id: "fecha-efecto-seguro",
    label: "Fecha efecto seguro",
    component: () =>
      import("./steps/fecha-efecto-seguro/fecha-efecto-seguro.component").then(
        (m) => m.FechaEfectoSeguroComponent,
      ),
  },
];
