import {
  AfterViewInit,
  Component,
  Type,
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

  readonly steps = USO_CONDUCTORES_STEPS;
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
    // ⭐ Si NO es propietario → siempre permitir Siguiente
    if (!inter.tomadorEsPropietario) {
      return true;
    }
    // ⭐ Caso normal: usar la validación de intervinientes
    return this.state.intervinientesCompleted();
  }

  return false;
});


  ngAfterViewInit(): void {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => this.syncStepFromUrl());

    this.syncStepFromUrl();
  }

  private get currentRouteStep(): string {
    const segments = this.router.parseUrl(this.router.url)
      .root.children['primary']?.segments.map(segment => segment.path) ?? [];

    if (segments.length >= 2) {
      return segments[1];
    }

    const last = this.state.lastStepId();
    if (last && this.steps.some(step => step.id === last)) {
      return last;
    }

    return this.steps[0].id;
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

    const index = this.steps.findIndex(step => step.id === stepId);
    if (index < 0) {
      this.navigateTo(this.steps[0].id, true);
      return;
    }

    this.activeIndex.set(index);
    this.state.setLastStep(stepId);

    await this.loadStep(stepId);
  }

  async loadStep(stepId: string): Promise<void> {
    const index = this.steps.findIndex(step => step.id === stepId);
    if (index < 0) {
      return;
    }

    this.activeIndex.set(index);

    const loaded = this.state.stepsLoaded() ?? new Array(this.steps.length).fill(false);

    for (let stepIndex = 0; stepIndex < loaded.length; stepIndex++) {
      if (loaded[stepIndex]) {
        const step = this.steps[stepIndex];
        const componentType = await step.component();
        this.stepOutlet.createComponent(componentType as Type<any>);
      }
    }

    if (!loaded[index]) {
      const step = this.steps[index];
      const componentType = await step.component();
      this.stepOutlet.createComponent(componentType as Type<any>);
      this.state.setStepLoaded(index);
    }
  }

goNext(): void {
  if (!this.nextEnabled()) return;
  if (this.navigating) return;

  const index = this.activeIndex();
  const inter = this.state.intervinientes();

  // ⭐ Paso 1: intervinientes
 if (index === 1) {
  const inter = this.state.intervinientes();

  // ⭐ Caso especial: tomador NO es propietario → ir a direccion-tomador
  if (!inter.tomadorEsPropietario) {
    this.navigating = true;
    this.router.navigate(['/uso-conductores', 'direccion-tomador']).finally(() => {
      this.navigating = false;
    });
    return;
  }

  // ⭐ Caso normal: tomador ES propietario → NO ir a direccion-tomador
  const nextIndex = Math.min(index + 1, this.steps.length - 1);
  const nextStepId = this.steps[nextIndex].id;

  this.state.setStepLoaded(nextIndex);
  this.state.setLastStep(nextStepId);

  this.navigating = true;
  this.router.navigate(['/uso-conductores', nextStepId]).finally(() => {
    this.navigating = false;
  });
  return;
}

  // ⭐ Resto de pasos tal como los tienes
  const nextIndex = Math.min(index + 1, this.steps.length - 1);
  const nextStepId = this.steps[nextIndex].id;

  this.state.setStepLoaded(nextIndex);
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
