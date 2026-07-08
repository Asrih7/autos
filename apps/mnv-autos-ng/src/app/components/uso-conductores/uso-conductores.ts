import {
  AfterViewInit,
  Component,
  Type,
  effect,
  computed,
  inject,
  signal,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { BalButton } from '@baloise/ds-angular';
import { TranslateModule } from '@ngx-translate/core';

import { USO_CONDUCTORES_STEPS } from './uso-conductores.steps';
import { UsoConductoresStateService } from './uso-conductores-state.service';

@Component({
  selector: 'app-uso-conductores',
  standalone: true,
  imports: [BalButton, TranslateModule],
  templateUrl: './uso-conductores.html',
  styleUrl: './uso-conductores.scss',
})
export class UsoConductoresComponent implements AfterViewInit {
  private readonly router = inject(Router);
  private readonly state = inject(UsoConductoresStateService);
  private navigating = false;

  @ViewChild('stepOutlet', { read: ViewContainerRef, static: true })
  private stepOutlet!: ViewContainerRef;

  readonly steps = computed(() => {
    const inter = this.state.intervinientes();
    if (inter?.tomadorEsPropietario) {
      return USO_CONDUCTORES_STEPS.filter(s => s.id !== 'direccion-tomador');
    }
    return USO_CONDUCTORES_STEPS;
  });
  readonly activeIndex = signal(0);

  readonly nextEnabled = computed(() => {
  const index = this.activeIndex();

  // Paso 0: uso-vehiculo
  if (index === 0) {
    return this.state.canContinueFromUso();
  }

  // Paso 1: intervinientes
  if (index === 1) {
    const inter = this.state.intervinientes();
    //  Si NO es propietario → siempre permitir Siguiente
    if (!inter.tomadorEsPropietario) {
      return true;
    }
    //  Caso normal: usar la validación de intervinientes
    return this.state.intervinientesCompleted();
  }

  return false;
});


  ngAfterViewInit(): void {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => this.syncStepFromUrl());

    this.syncStepFromUrl();

    // Si se marca 'tomador es propietario' mientras el usuario está en la
    // página de dirección del tomador, volvemos automáticamente a intervinientes.
    effect(() => {
      const inter = this.state.intervinientes();
      const tomadorEsPropietario = !!inter?.tomadorEsPropietario;
      const current = this.currentRouteStep;
      const direccionOriginalIndex = USO_CONDUCTORES_STEPS.findIndex(s => s.id === 'direccion-tomador');
      if (tomadorEsPropietario && direccionOriginalIndex >= 0) {
        // Si marcamos tomador como propietario debemos eliminar cualquier carga
        // previa de la step 'direccion-tomador' y recargar el step actual sin ella.
        this.state.clearStepLoaded(direccionOriginalIndex);
        this.state.setLastStep('intervinientes');
        // limpiar y recargar el paso actual para remover el componente si estaba creado
        try {
          this.stepOutlet.clear();
        } catch {}
        void this.loadStep(this.currentRouteStep);
        // si el usuario estaba en la pantalla de direccion, forzamos navegación atrás
        if (current === 'direccion-tomador') {
          this.navigateTo('intervinientes', true);
        }
      }
    });
  }

  private get currentRouteStep(): string {
    const segments = this.router.parseUrl(this.router.url)
      .root.children['primary']?.segments.map(segment => segment.path) ?? [];

    if (segments.length >= 2) {
      return segments[1];
    }

    const last = this.state.lastStepId();
    if (last && this.steps().some(step => step.id === last)) {
      return last;
    }

    return this.steps()[0].id;
  }

  private async syncStepFromUrl(): Promise<void> {
    const stepId = this.currentRouteStep;

    try {
      this.stepOutlet.clear();
    } catch (error) {
      console.warn('stepOutlet.clear() falló', error);
    }

    if (stepId === 'intervinientes' && !this.state.canContinueFromUso()) {
      this.navigateTo('uso-vehiculo', true);
      return;
    }

    const index = this.steps().findIndex(step => step.id === stepId);
    if (index < 0) {
      this.navigateTo(this.steps()[0].id, true);
      return;
    }

    this.activeIndex.set(index);
    this.state.setLastStep(stepId);

    await this.loadStep(stepId);
  }

  async loadStep(stepId: string): Promise<void> {
    const currentSteps = this.steps();
    const index = currentSteps.findIndex(step => step.id === stepId);
    if (index < 0) {
      return;
    }

    this.activeIndex.set(index);

    // stepsLoaded is stored by the original static step ordering (USO_CONDUCTORES_STEPS)
    const loaded = this.state.stepsLoaded() ?? new Array(USO_CONDUCTORES_STEPS.length).fill(false);

    for (let stepIndex = 0; stepIndex < currentSteps.length; stepIndex++) {
      const step = currentSteps[stepIndex];
      const originalIndex = USO_CONDUCTORES_STEPS.findIndex(s => s.id === step.id);
      if (originalIndex >= 0 && loaded[originalIndex]) {
        const componentType = await step.component();
        this.stepOutlet.createComponent(componentType as Type<any>);
      }
    }

    const currentStep = currentSteps[index];
    const currentOriginalIndex = USO_CONDUCTORES_STEPS.findIndex(s => s.id === currentStep.id);
    if (currentOriginalIndex >= 0 && !loaded[currentOriginalIndex]) {
      const componentType = await currentStep.component();
      this.stepOutlet.createComponent(componentType as Type<any>);
      this.state.setStepLoaded(currentOriginalIndex);
    }
  }

goNext(): void {
  if (!this.nextEnabled()) return;
  if (this.navigating) return;

  const index = this.activeIndex();

  // DEBUG: log current intervinientes flags to help diagnose unexpected navigation
  try {
    const liveInter = this.state.intervinientes();
    // eslint-disable-next-line no-console
    console.debug('[UsoConductores] goNext', { index, tomadorEsPropietario: liveInter?.tomadorEsPropietario, intervinientesCompleted: this.state.intervinientesCompleted() });
  } catch (e) {
    // ignore
  }

  //  Paso 1: intervinientes
  if (index === 1) {
    const inter = this.state.intervinientes();

    // Caso especial: tomador NO es propietario → ir a direccion-tomador
    if (!inter.tomadorEsPropietario) {
      this.navigating = true;
      this.router.navigate(['/uso-conductores', 'direccion-tomador']).finally(() => {
        this.navigating = false;
      });
      return;
    }

    // Caso normal: tomador ES propietario → saltar cualquier step 'direccion-tomador'
    let nextIndex = index + 1;
    while (nextIndex < this.steps().length && this.steps()[nextIndex].id === 'direccion-tomador') {
      nextIndex++;
    }
    if (nextIndex >= this.steps().length) {
      // No hay un siguiente step distinto a 'direccion-tomador' que mostrar.
      // Comportamiento solicitado: no navegar a 'direccion-tomador' cuando
      // tomadorEsPropietario === true, así que simplemente no navegamos.
      return;
    }

    const nextStepId = this.steps()[nextIndex].id;

    const nextOriginalIndex = USO_CONDUCTORES_STEPS.findIndex(s => s.id === nextStepId);
    if (nextOriginalIndex >= 0) {
      this.state.setStepLoaded(nextOriginalIndex);
    }
    this.state.setLastStep(nextStepId);

    this.navigating = true;
    this.router.navigate(['/uso-conductores', nextStepId]).finally(() => {
      this.navigating = false;
    });
    return;
}

  //  Resto de pasos tal como los tienes
  const nextIndex = Math.min(index + 1, this.steps().length - 1);
  const nextStepId = this.steps()[nextIndex].id;

  const nextOriginalIndex = USO_CONDUCTORES_STEPS.findIndex(s => s.id === nextStepId);
  if (nextOriginalIndex >= 0) {
    this.state.setStepLoaded(nextOriginalIndex);
  }
  this.state.setLastStep(nextStepId);

  this.navigating = true;
  this.router.navigate(['/uso-conductores', nextStepId]).finally(() => {
    this.navigating = false;
  });
}



  private navigateTo(stepId: string, replaceUrl = false): void {
    this.router.navigate(['/uso-conductores', stepId], { replaceUrl });
  }
}

export interface StepDefinition {
  id: string;
  label: string;
  component: () => Promise<any>;
}
