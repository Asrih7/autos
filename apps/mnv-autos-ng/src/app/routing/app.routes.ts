import { Route } from '@angular/router';

export const appRoutes: Route[] = [

  {
    path: 'tu-cliente',
    loadComponent: () =>
      import('../components/tu-cliente/tu-cliente')
        .then(m => m.TuClienteComponent),
    data: { pageId: 'tu-cliente', label: 'Tu cliente', showInMenu: true },
  },

  {
    path: 'vehiculos',
    redirectTo: 'vehiculos/busqueda-matricula',
    pathMatch: 'full'
  },
  {
    path: 'vehiculos/:step',
    loadComponent: () =>
      import('../components/vehiculo/vehiculo')
        .then(m => m.VehiculoComponent),
    data: { pageId: 'vehiculos', label: 'Vehículos', showInMenu: true },
  },

  // Ruta base → redirige automáticamente
  {
    path: 'uso-conductores',
    redirectTo: 'uso-conductores/uso-vehiculo',
    pathMatch: 'full'
  },

  //  Ruta con step
  {
    path: 'uso-conductores/:step',
    loadComponent: () =>
      import('../components/uso-conductores/uso-conductores')
        .then(m => m.UsoConductoresComponent),
    data: { pageId: 'uso-conductores', label: 'Conductores', showInMenu: true },
  },

  {
    path: 'precio-coberturas',
    loadComponent: () =>
      import('../components/precio-coberturas/precio-coberturas')
        .then(m => m.PrecioCoberturasComponent),
    data: { pageId: 'precio-coberturas', label: 'Precio y coberturas', showInMenu: true },
  },

  {
    path: 'contratacion',
    loadComponent: () =>
      import('../components/contratacion/contratacion')
        .then(m => m.ContratacionComponent),
    data: { pageId: 'contratacion', label: 'Contratación', showInMenu: true },
  },

  { path: '', redirectTo: 'tu-cliente', pathMatch: 'full' },
];
