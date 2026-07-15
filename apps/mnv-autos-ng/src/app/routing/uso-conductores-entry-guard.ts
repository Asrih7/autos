import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";

import { UsoConductoresStateService } from "../components/uso-conductores/uso-conductores-state.service";
import { USO_CONDUCTORES_STEPS } from "../components/uso-conductores/uso-conductores.steps";

/**
 * Guard para la ruta 'uso-conductores' (path: 'uso-conductores', pathMatch: 'full').
 *
 * Antes esta ruta tenía un redirectTo estático a 'uso-conductores/uso-vehiculo',
 * lo que significaba que SIEMPRE aterrizabas en el primer step al entrar a la
 * sección, sin importar en qué step te habías quedado la última vez. Además,
 * como el redirect ocurre a nivel de router ANTES de que el componente exista,
 * era imposible para el componente distinguir "me redirigieron acá por
 * defecto" de "el usuario navegó/escribió esta URL a propósito" — ambos casos
 * producen exactamente la misma URL final.
 *
 * Este guard resuelve el redirect de forma dinámica: si hay un lastStepId
 * guardado y sigue siendo un step válido, redirige ahí. Si no, cae al primer
 * step por defecto. Como esto pasa a nivel de ruta, ya no hace falta ninguna
 * lógica de "restaurar último step" dentro del componente — el componente
 * simplemente confía en la URL que el router ya resolvió correctamente.
 */
export const usoConductoresEntryGuard: CanActivateFn = () => {
  const router = inject(Router);
  const state = inject(UsoConductoresStateService);

  const lastStep = state.lastStepId();
  const isValidStep =
    !!lastStep && USO_CONDUCTORES_STEPS.some((step) => step.id === lastStep);

  const targetStep = isValidStep ? lastStep! : USO_CONDUCTORES_STEPS[0].id;

  return router.parseUrl(`/uso-conductores/${targetStep}`);
};