import { HeOCPSSOAuthGuardService } from '@archit-lib-helvetiang/core/ocp-sso';
import { AppPageDefinition } from './navigation.model';

const AUTH_GUARD = [HeOCPSSOAuthGuardService];

export const APP_PAGES: AppPageDefinition[] = [
 {
  id: 'tu-cliente',
  path: 'tu-cliente',
  label: 'Tu cliente',
  showInMenu: true,
  canActivate: AUTH_GUARD,
  steps: [],
},
  {
    id: 'vehiculos',
    path: 'vehiculos',
    label: 'Vehículos',
    showInMenu: true,
    canActivate: AUTH_GUARD,
    steps: [],
  },
  {
    id: 'uso-conductores',
    path: 'uso-conductores',
    label: 'Conductores',
    showInMenu: true,
    canActivate: AUTH_GUARD,
    steps: [
      { id: 'uso-vehiculo',          label: 'Usos del vehículo' },
      { id: 'intervinientes',        label: 'Intervinientes' },
      { id: 'direccion-propietario', label: 'Dirección del propietario' },
    ],
  },
  {
    id: 'precio-coberturas',
    path: 'precio-coberturas',
    label: 'Precio y coberturas',
    showInMenu: true,
    canActivate: AUTH_GUARD,
    steps: [],
  },
  {
    id: 'contratacion',
    path: 'contratacion',
    label: 'Contratación',
    showInMenu: true,
    canActivate: AUTH_GUARD,
    steps: [],
  },
];
