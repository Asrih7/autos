import { Component, inject, signal, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { NgComponentOutlet } from '@angular/common';
import { BalButton } from '@baloise/ds-angular';
import { USO_CONDUCTORES_STEPS } from './uso-conductores.steps';
import { PageNavigationService } from '@mnv-autos-ng/navigation';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-uso-conductores',
  standalone: true,
  imports: [NgComponentOutlet, BalButton],
  templateUrl: './uso-conductores.html',
  styleUrl: './uso-conductores.scss'
})
export class UsoConductoresComponent implements OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private navigation = inject(PageNavigationService);

  steps = USO_CONDUCTORES_STEPS;
  currentComponent = signal<any>(null);
  isLastStep = this.navigation.isLastStep('uso-conductores');

  private subs = new Subscription();

  constructor() {
    const initialStep = this.route.snapshot.params['step'] ?? this.steps[0]?.id ?? 'uso-vehiculo';
    this.loadStep(initialStep);

    this.subs.add(
      this.route.params.subscribe((params: Params) => {
        const nextStep = params['step'] ?? this.steps[0]?.id ?? 'uso-vehiculo';
        this.loadStep(nextStep);
      })
    );

    if ((this.navigation as any).pageNext$) {
      this.subs.add(
        (this.navigation as any).pageNext$.subscribe((pageId: string) => {
          if (pageId === 'uso-conductores') {
            this.navigateNext();
          }
        })
      );
    }
  }

  private async loadStep(stepId: string) {
    const validStep = this.steps.some((step) => step.id === stepId);
    const targetStepId = validStep ? stepId : this.steps[0]?.id ?? 'uso-vehiculo';

    if (!validStep && stepId) {
      void this.router.navigate(['/uso-conductores', targetStepId], { replaceUrl: true });
    }

    const stepDefinition = this.steps.find((step) => step.id === targetStepId) ?? this.steps[0];
    if (!stepDefinition) return;

    const component = await stepDefinition.component();
    this.currentComponent.set(component);
  }

  navigateNext() {
    this.navigation.next('uso-conductores');
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
