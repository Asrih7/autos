import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";

import { UsoConductoresStateService } from "../../components/uso-conductores/uso-conductores-state.service";
import { USO_CONDUCTORES_STEPS } from "../../components/uso-conductores/uso-conductores.steps";

export const usoConductoresEntryGuard: CanActivateFn = () => {
  const router = inject(Router);
  const state = inject(UsoConductoresStateService);

  const lastStep = state.lastStepId();
  const isValidStep =
    !!lastStep && USO_CONDUCTORES_STEPS.some((step) => step.id === lastStep);

  const targetStep = isValidStep ? lastStep! : USO_CONDUCTORES_STEPS[0].id;
  return router.parseUrl(`/uso-conductores/${targetStep}`);
};