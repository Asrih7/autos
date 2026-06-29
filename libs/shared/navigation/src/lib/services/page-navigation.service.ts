import { Injectable, inject, Signal, computed } from "@angular/core";
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, NavigationEnd } from "@angular/router";
import { filter, map } from "rxjs";
import { APP_PAGES } from '@mnv-autos-ng/models';

interface PageState {
  steps: string[];
  basePath: string;
}

@Injectable({ providedIn: 'root' })
export class PageNavigationService {
  private readonly router = inject(Router);

  private readonly pages = new Map<string, PageState>();

  // Signal reactivo que se actualiza en cada NavigationEnd
  private readonly currentUrl: Signal<string> = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => (e as NavigationEnd).urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  constructor() {
    for (const page of APP_PAGES) {
      this.pages.set(page.id, {
        steps: page.steps?.map((s) => s.id) ?? [],
        basePath: page.path,
      });
    }
  }

  // — READ ————————————————————————————————————————————

  getVisibleSteps(pageId: string): string[] {
    return this.pages.get(pageId)?.steps ?? [];
  }

  /**
   * Computed signal con el índice del step activo.
   * Reactivo: se recalcula automáticamente cuando cambia la URL.
   */
  currentStepIndex(pageId: string): Signal<number> {
    return computed(() => {
      const page = this.pages.get(pageId);
      if (!page) return 0;
      const url = this.currentUrl();
      const idx = page.steps.findIndex((stepId) => url.includes(stepId));
      return idx >= 0 ? idx : 0;
    });
  }

  /**
   * Computed signal: true si el step es el activo según la URL.
   */
  isStepVisible(pageId: string, stepId: string): Signal<boolean> {
    return computed(() => {
      const page = this.pages.get(pageId);
      if (!page) return false;
      const url = this.currentUrl();
      if (!url.includes('/')) return page.steps[0] === stepId;
      return url.includes(stepId);
    });
  }

  /**
   * Computed signal: true si el step ya fue completado
   * (su índice es menor que el del step activo).
   */
  isStepCompleted(pageId: string, stepId: string): Signal<boolean> {
    return computed(() => {
      const page = this.pages.get(pageId);
      if (!page) return false;
      const stepIdx = page.steps.indexOf(stepId);
      return stepIdx < this.currentStepIndex(pageId)();
    });
  }

  isFirstStep(pageId: string): Signal<boolean> {
    return computed(() => this.currentStepIndex(pageId)() === 0);
  }

  isLastStep(pageId: string): Signal<boolean> {
    return computed(() => {
      const page = this.pages.get(pageId);
      if (!page) return true;
      return this.currentStepIndex(pageId)() === page.steps.length - 1;
    });
  }

  // — NAVIGATE ————————————————————————————————————————

  /** Ir a un step concreto por id. */
  goToStep(pageId: string, stepId: string): void {
    const page = this.pages.get(pageId);
    if (!page || !page.steps.includes(stepId)) return;
    void this.router.navigate([page.basePath, stepId]);
  }

  /** Avanzar al siguiente step. */
  next(pageId: string): void {
    const page = this.pages.get(pageId);
    if (!page?.steps.length) return;
    const nextIdx = this.currentStepIndex(pageId)() + 1;
    if (nextIdx < page.steps.length) {
      void this.router.navigate([page.basePath, page.steps[nextIdx]]);
    }
  }

  /** Retroceder al step anterior. */
  previous(pageId: string): void {
    const page = this.pages.get(pageId);
    if (!page?.steps.length) return;
    const prevIdx = this.currentStepIndex(pageId)() - 1;
    if (prevIdx >= 0) {
      void this.router.navigate([page.basePath, page.steps[prevIdx]]);
    }
  }

  /** @deprecated usa next() */
  nextPage(pageId: string, _mode: 'last' = 'last'): void { this.next(pageId); }
  /** @deprecated usa previous() */
  previousPage(pageId: string, _mode: 'last' = 'last'): void { this.previous(pageId); }

  /** @deprecated usa goToStep() */
  setCurrentStepIndex(pageId: string, index: number): void {
    const page = this.pages.get(pageId);
    if (!page) return;
    const stepId = page.steps[index];
    if (stepId) void this.router.navigate([page.basePath, stepId]);
  }

  registerStepValidators(_pageId: string, _validators: unknown): void {}
}