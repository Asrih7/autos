import { inject } from "@angular/core";
import { CanActivateFn, Router, UrlTree } from "@angular/router";
import { VehiculoStateService } from "../../components/vehiculo/services/vehiculo-state.service";
import { VEHICULO_STEPS } from "../../components/vehiculo/vehiculo.steps";

export const vehiculoProgressGuard: CanActivateFn = (
  route,
): boolean | UrlTree => {
  const router = inject(Router);
  const stateService = inject(VehiculoStateService);
  const state = stateService.state();
  const requestedStep = route.paramMap.get("step");

  if (requestedStep === ":step" || !requestedStep) {
    return router.createUrlTree(["/vehiculos", "busqueda-matricula"]);
  }

  const requestedIdx = VEHICULO_STEPS.findIndex((s) => s.id === requestedStep);

  if (requestedIdx === -1) {
    return router.createUrlTree(["/vehiculos", "busqueda-matricula"]);
  }

  let maxAllowedIdx = 0;

  const vehicle = state.vehiculoData;
  const hasManualActive = state.matriculaOBastidor === "MANUAL_SEARCH_ACTIVE";
  const hasCarData = !!(vehicle?.marca?.id || vehicle?.modelo?.id);

  if (state.matriculaOBastidor || hasManualActive || hasCarData) {
    maxAllowedIdx = 1;
  }

  if (hasCarData) {
    maxAllowedIdx = 2;
  }

  if (vehicle?.version) {
    maxAllowedIdx = 3;
  }

  if (vehicle?.restoCampos) {
    maxAllowedIdx = 4;
  }

  if (requestedIdx > maxAllowedIdx) {
    const fallbackStepId = VEHICULO_STEPS[maxAllowedIdx].id;
    return router.createUrlTree(["/vehiculos", fallbackStepId]);
  }

  return true;
};
