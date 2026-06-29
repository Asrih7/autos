import { Route } from '@angular/router';
import { APP_PAGES } from '@mnv-autos-ng/models';

/**
 * IMPORTANT: When a parent route uses loadComponent (lazy), its children
 * must be defined with loadChildren pointing to a routes array, OR the
 * parent must use loadChildren itself (not loadComponent + children).
 *
 * Pattern used here:
 *   - Pages WITHOUT steps → loadComponent (simple lazy component)
 *   - Pages WITH steps    → loadChildren (returns a routes array that includes
 *                           the parent component as the '' path + all step children)
 *
 * This avoids the "loadComponent + children" combination that causes Angular
 * to fail to activate child routes.
 */

export const appRoutes: Route[] = [

  // ── Pages WITHOUT child steps (simple loadComponent) ──────────────────────

  {
    path: 'vehiculos',
    canActivate: APP_PAGES.find(p => p.id === 'vehiculos')!.canActivate,
    loadComponent: () =>
      import('../components/vehiculo/vehiculo').then(m => m.VehiculoComponent),
    data: { pageId: 'vehiculos', label: 'Vehículos', showInMenu: true },
  },
  {
    path: 'precio-coberturas',
    canActivate: APP_PAGES.find(p => p.id === 'precio-coberturas')!.canActivate,
    loadComponent: () =>
      import('../components/precio-coberturas/precio-coberturas').then(m => m.PrecioCoberturasComponent),
    data: { pageId: 'precio-coberturas', label: 'Precio y coberturas', showInMenu: true },
  },
  {
    path: 'contratacion',
    canActivate: APP_PAGES.find(p => p.id === 'contratacion')!.canActivate,
    loadComponent: () =>
      import('../components/contratacion/contratacion').then(m => m.ContratacionComponent),
    data: { pageId: 'contratacion', label: 'Contratación', showInMenu: true },
  },

  // ── Pages WITH child steps — use loadChildren to avoid lazy+children bug ──

  {
    path: 'uso-conductores',
    canActivate: APP_PAGES.find(p => p.id === 'uso-conductores')!.canActivate,
    loadChildren: () => [
      {
        path: '',
        loadComponent: () =>
          import('../components/uso-conductores/uso-conductores')
            .then(m => m.UsoConductoresComponent),
        data: { pageId: 'uso-conductores', label: 'Conductores', showInMenu: true },
        children: [
          {
            path: 'uso-vehiculo',
            loadComponent: () =>
              import('../components/uso-conductores/steps/uso-vehiculo/uso-vehiculo')
                .then(m => m.UsoVehiculoComponent),
            data: { pageId: 'uso-conductores', stepId: 'uso-vehiculo' },
          },
          {
            path: 'intervinientes',
            loadComponent: () =>
              import('../components/uso-conductores/steps/intervinientes/intervinientes')
                .then(m => m.IntervinientesComponent),
            data: { pageId: 'uso-conductores', stepId: 'intervinientes' },
          },
          {
            path: 'direccion-propietario',
            loadComponent: () =>
              import('../components/uso-conductores/steps/direccion-propietario/direccion-propietario')
                .then(m => m.DireccionPropietarioComponent),
            data: { pageId: 'uso-conductores', stepId: 'direccion-propietario' },
          },
          { path: '', redirectTo: 'uso-vehiculo', pathMatch: 'full' },
        ],
      },
    ] as Route[],
  },

 

  // ── Root page LAST (path:'') ───────────────────────────────────────────────
  {
    path: '',
    canActivate: APP_PAGES.find(p => p.id === 'tu-cliente')!.canActivate,
    loadComponent: () =>
      import('../components/tu-cliente/tu-cliente').then(m => m.TuClienteComponent),
    data: { pageId: 'tu-cliente', label: 'Tu cliente', showInMenu: true },
  },
];
