import { Component, inject, computed, input, Type, OnInit, OnDestroy, effect } from '@angular/core';
import { Router } from '@angular/router';
import { NgComponentOutlet } from '@angular/common';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap, from, of, map } from 'rxjs';
import { VEHICULO_STEPS, VehiculoStepDefinition } from './vehiculo.steps';
import { ScrollOnRenderDirective } from '@mnv-autos-ng/util';
import { PageNavigationService } from '@mnv-autos-ng/navigation';
import { VehiculoStateService } from './services/vehiculo-state.service';

export type StepCompleteCallback = (stepOutputData: unknown) => void;

export interface RenderedLayer {
  id: string;
  componentClass: Type<unknown>;
  inputs: {
    stepId: string;
    onStepComplete: StepCompleteCallback;
  };
}

@Component({
  selector: 'app-vehiculo',
  standalone: true,
  imports: [NgComponentOutlet, ScrollOnRenderDirective],
  templateUrl: './vehiculo.component.html',
  styleUrls: ['./vehiculo.component.scss']
})
export class VehiculoComponent implements OnInit, OnDestroy {
  private readonly navService = inject(PageNavigationService);
  private readonly router = inject(Router);
  private readonly stateService = inject(VehiculoStateService);

  step = input.required<string>();
  readonly steps: VehiculoStepDefinition[] = VEHICULO_STEPS;
  
  private isNavigating = false;

  readonly isOnLastStep = computed(() => {
    const currentStep = this.step();
    return this.steps.length > 0 && currentStep === this.steps[this.steps.length - 1].id;
  });

  ngOnInit() {
    this.navService.activePageConfig.set({
      pageId: 'vehiculos',
      previousPageUrl: '/tu-cliente',
      previousPageLabel: 'Tu cliente',
      nextPageUrl: '/uso-conductores',
      canContinueNext: () => this.isOnLastStep()
    });
  }

  private readonly targetStepsToRender = computed(() => {
    const currentStep = this.step();
    const state = this.stateService.state();
    const vehicle = state.vehiculoData;
    
    const stepsToRender: VehiculoStepDefinition[] = [this.steps[0]];

    const hasManualActive = state.matriculaOBastidor === 'MANUAL_SEARCH_ACTIVE';
    const hasBrandSelected = !!vehicle?.marca?.id;
    const hasModelSelected = !!vehicle?.modelo?.id;
    const hasVersionSelected = !!vehicle?.version?.id;
    const hasRestoCamposFilled = !!vehicle?.restoCampos;
    
    if (currentStep === 'busqueda-manual' || hasManualActive || hasBrandSelected || hasModelSelected) {
      if (this.steps[1]) stepsToRender.push(this.steps[1]);
    }

    if (currentStep === 'confirmacion-version' || hasModelSelected) {
      if (this.steps[2]) stepsToRender.push(this.steps[2]);
    }

    const activeIdx = this.steps.findIndex(s => s.id === currentStep);
    
    if (hasVersionSelected && activeIdx >= 3) {
      if (this.steps[3]) stepsToRender.push(this.steps[3]);
    }
    
    if (hasRestoCamposFilled && activeIdx >= 4) {
      if (this.steps[4]) stepsToRender.push(this.steps[4]);
    }

    return stepsToRender;
  });


  private readonly renderedSteps$ = toObservable(this.targetStepsToRender).pipe(
    switchMap((blueprints) => {
      if (blueprints.length === 0) return of([]);
      
      const loadingPromises = blueprints.map(async (stepDef) => {
        const componentClass = await stepDef.component();
        return { stepDef, componentClass };
      });

      return from(Promise.all(loadingPromises));
    }),
    map((resolvedPairs) => 
      resolvedPairs.map(({ stepDef, componentClass }) => ({
        id: stepDef.id,
        componentClass,
        inputs: {
          stepId: stepDef.id,
          onStepComplete: (data: unknown) => this.handleStepNavigation(stepDef.id, data)
        }
      }))
    )
  );

  readonly renderedSteps = toSignal(this.renderedSteps$, { initialValue: [] });

  constructor() {
    effect(() => {
      const steps = this.renderedSteps();
      if (steps.length > 0) {
        const last = steps[steps.length - 1];
        this.navService.currentStepCallback.set(last.inputs.onStepComplete);
      }
    });
  }

  handleStepNavigation(currentStepId: string, stepOutputData: any): void {
    if (this.isNavigating) return;

    if (stepOutputData?.status === "REGISTRATION_LOOKUP_COMPLETE") {
      this.isNavigating = true;
      
      this.router.navigate(['/vehiculos', 'confirmacion-version']).then(() => {
        this.isNavigating = false;
      });
      return;
    }

    const idx = this.steps.findIndex(s => s.id === currentStepId);
    const nextStep = this.steps[idx + 1];

    this.isNavigating = true;

    if (nextStep) {
      this.router.navigate(['/vehiculos', nextStep.id]).then(() => {
        this.isNavigating = false;
      });
    } else {
      this.router.navigateByUrl('/uso-conductores').then(() => {
        this.isNavigating = false;
      });
    }
  }

  ngOnDestroy() {
    this.navService.activePageConfig.set(null);
  }
}
