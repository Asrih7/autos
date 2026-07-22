import { Route } from '@angular/router';
import { vehiculoProgressGuard } from '../core/guards/vehiculo-progress.guard';

import { usoConductoresEntryGuard } from './uso-conductores-entry.guard';

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
    canActivate: [vehiculoProgressGuard],
    loadComponent: () =>
      import('../components/vehiculo/vehiculo')
        .then(m => m.VehiculoComponent),
    data: { pageId: 'vehiculos', label: 'Vehículos', showInMenu: true },
  },

  // 🔥 FIX: ya no es un redirectTo estático al primer step. Este guard
  // decide dinámicamente a qué step redirigir según state.lastStepId(),
  // así que volver a la sección te devuelve a donde te quedaste, en vez de
  // forzarte siempre a 'uso-vehiculo'.
  {
    path: 'uso-conductores',
    pathMatch: 'full',
    canActivate: [usoConductoresEntryGuard],
    // No hace falta component/loadComponent: el guard siempre devuelve un
    // UrlTree de redirect, nunca deja pasar la activación de esta ruta.
    children: [],
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