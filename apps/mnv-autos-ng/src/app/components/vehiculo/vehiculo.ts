import { Component, inject, computed, input, Type, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { NgComponentOutlet } from '@angular/common';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap, from, of } from 'rxjs';
import { VEHICULO_STEPS, VehiculoStepDefinition } from './vehiculo.steps';
import { VehiculoStateService } from './services/vehiculo-state.service';
import { ScrollOnRenderDirective } from '@mnv-autos-ng/util';
import { PageNavigationService } from '@mnv-autos-ng/navigation';

export type StepCompleteCallback = (stepOutputData: unknown) => void;
export interface RenderedLayer {
  id: string;
  componentClass: Type<unknown>;
  inputs: {
    onStepComplete: StepCompleteCallback;
  };
}

@Component({
  selector: 'app-vehiculo',
  standalone: true,
  imports: [NgComponentOutlet, ScrollOnRenderDirective],
  templateUrl: './vehiculo.html',
  styleUrls: ['./vehiculo.scss']
})
export class VehiculoComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly stateService = inject(VehiculoStateService);
  private readonly navService = inject(PageNavigationService);
  
  step = input.required<string>();
  readonly steps: VehiculoStepDefinition[] = VEHICULO_STEPS;

  ngOnInit() {
    this.navService.activePageConfig.set({
      pageId: 'vehiculos',
      previousPageUrl: '/tu-cliente',
      previousPageLabel: 'Tu cliente',
      nextPageUrl: '/uso-conductores'
    });
  }

  private readonly verifiedStep = computed(() => {
    const currentStep = this.step();
    const state = this.stateService.state();

    if (currentStep === ':step') {
      void this.router.navigate(['/vehiculos', 'busqueda-matricula'], { replaceUrl: true });
      return 'busqueda-matricula';
    }
    
    if (!state.matriculaOBastidor && currentStep !== 'busqueda-matricula') {
      void this.router.navigate(['/vehiculos', 'busqueda-matricula'], { replaceUrl: true });
      return 'busqueda-matricula';
    }
    
    return this.steps.some(s => s.id === currentStep) ? currentStep : 'busqueda-matricula';
  });

  private readonly targetStepsToRender = computed(() => {
    const targetIdx = this.steps.findIndex(s => s.id === this.verifiedStep());
    return targetIdx !== -1 ? this.steps.slice(0, targetIdx + 1) : [this.steps[0]];
  });

  private readonly loadedComponents$ = toObservable(this.targetStepsToRender).pipe(
    switchMap((blueprints) => {
      if (blueprints.length === 0) return of([]);
      const loadingPromises = blueprints.map(step => step.component());
      return from(Promise.all(loadingPromises));
    })
  );

  private readonly loadedComponents = toSignal(this.loadedComponents$, { initialValue: [] });

  readonly renderedSteps = computed<RenderedLayer[]>(() => {
    const components = this.loadedComponents();
    const stepBlueprints = this.targetStepsToRender();

    return stepBlueprints.map((stepDef, idx) => ({
      id: stepDef.id,
      componentClass: components[idx],
      inputs: {
        onStepComplete: (data: unknown) => this.handleStepNavigation(stepDef.id, data)
      }
    }));
  });

  handleStepNavigation(currentStepId: string, stepOutputData: unknown): void {
    console.log(`Navigation triggered from ${currentStepId}`, stepOutputData);

    const idx = this.steps.findIndex(s => s.id === currentStepId);
    const nextStep = this.steps[idx + 1];

    if (nextStep) {
      void this.router.navigate(['/vehiculos', nextStep.id]);
    } else {
      void this.router.navigateByUrl('/uso-conductores');
    }
  }

  ngOnDestroy() {
    this.navService.activePageConfig.set(null);
  }
}
