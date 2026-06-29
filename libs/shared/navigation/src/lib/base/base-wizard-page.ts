import { computed, Directive, inject, Signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PageNavigationService } from '../services/page-navigation.service';
import { StepValidatorMap } from '../../../../models/src/lib/navigation.model';

/**
 * BaseWizardPage — base class for all wizard page components.
 *
 * With URL-driven navigation the component no longer needs computed() signals
 * for currentStepIndex because the Router handles step display via child routes.
 *
 * Usage in a wizard page component template:
 *   <!-- each sub-step is a routed child, rendered by <router-outlet> -->
 *   <router-outlet />
 *
 *   <!-- nav buttons -->
 *   <button (click)="previous()">Atrás</button>
 *   <button (click)="next()">Siguiente</button>
 *
 * If a page still uses *ngIf="isVisible('step-id')" for inline steps (not
 * child routes), that works too — isVisible() reads the current URL.
 */
@Directive()
export abstract class BaseWizardPage {
  protected readonly route      = inject(ActivatedRoute);
  protected readonly navigation = inject(PageNavigationService);
  readonly pageId = this.route.snapshot.data['pageId'] as string;

  protected stepValidators: StepValidatorMap = {};

  protected stepVisible(stepId: string): Signal<boolean> {
    return this.navigation.isStepVisible(this.pageId, stepId);
  }

  protected stepCompleted(stepId: string): Signal<boolean> {
    return this.navigation.isStepCompleted(this.pageId, stepId);
  }

  protected readonly currentStepIndex: Signal<number> = computed(() =>
    this.navigation.currentStepIndex(this.pageId)()
  );

  readonly isFirstStep: Signal<boolean> = computed(() =>
    this.navigation.isFirstStep(this.pageId)()
  );

  readonly isLastStep: Signal<boolean> = computed(() =>
    this.navigation.isLastStep(this.pageId)()
  );

  getVisibleSteps(): string[] {
    return this.navigation.getVisibleSteps(this.pageId);
  }

  next():     void { this.navigation.next(this.pageId); }
  previous(): void { this.navigation.previous(this.pageId); }

  /** @deprecated usa next() */
  nextPage():     void { this.navigation.next(this.pageId); }
  /** @deprecated usa previous() */
  previousPage(): void { this.navigation.previous(this.pageId); }

  goToStep(stepId: string): void { this.navigation.goToStep(this.pageId, stepId); }
}
