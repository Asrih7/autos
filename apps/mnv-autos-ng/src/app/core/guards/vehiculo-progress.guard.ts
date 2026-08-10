import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { VehiculoStateService } from '../../components/vehiculo/services/vehiculo-state.service';

export const vehiculoProgressGuard: CanActivateFn = (route): boolean | UrlTree => {
  const router = inject(Router);
  const stateService = inject(VehiculoStateService);
  const state = stateService.state();
  
  const requestedStep = route.paramMap.get('step');

  if (requestedStep === ':step') {
    return router.createUrlTree(['/vehiculos', 'busqueda-matricula']);
  }

  if (!state.matriculaOBastidor) {
    if (requestedStep !== 'busqueda-matricula') {
      return router.createUrlTree(['/vehiculos', 'busqueda-matricula']);
    }
    return true;
  }

  let furthestStep = 'busqueda-matricula';
  if (state.vehiculoData?.restoCampos) {
    furthestStep = 'accesorios';
  } else if (state.vehiculoData?.version) {
    furthestStep = 'resto-campos';
  } else if (state.vehiculoData?.marca || state.matriculaOBastidor === 'MANUAL_SEARCH_ACTIVE') {
    furthestStep = 'confirmacion-version';
  }

  if (requestedStep === 'busqueda-matricula' && state.matriculaOBastidor) {
    return router.createUrlTree(['/vehiculos', furthestStep]);
  }

  return true;
};
