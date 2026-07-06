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

import { USO_CONDUCTORES_STEPS } from './uso-conductores.steps';
import { UsoConductoresStateService } from './uso-conductores-state.service';

@Component({
  selector: 'app-uso-conductores',
  standalone: true,
  imports: [BalButton],
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
  readonly boundSteps = computed(() => this.state.stepsLoaded());

  readonly stepValid = computed(() =>
    this.steps.map(step => {
      switch (step.id) {
        case 'uso-vehiculo':
          return this.state.canContinueFromUso();
        case 'intervinientes':
          return this.state.intervinientesCompleted();
        default:
          return true;
      }
    })
  );

  readonly showNext = computed(() => this.activeIndex() < this.steps.length - 1);
  readonly currentStepValid = computed(() => this.stepValid()[this.activeIndex()] ?? false);
  readonly nextEnabled = computed(() => this.currentStepValid() && this.showNext());

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

    if (stepId === 'direccion-propietario' && !this.state.intervinientesCompleted()) {
      this.navigateTo('intervinientes', true);
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
    if (!this.nextEnabled()) {
      return;
    }

    if (this.navigating) {
      return;
    }

    const nextIndex = Math.min(this.activeIndex() + 1, this.steps.length - 1);
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
