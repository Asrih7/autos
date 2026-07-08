import { Component, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { BalButton } from '@baloise/ds-angular';
import type { Route } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [BalButton],
  templateUrl: './app-footer.component.html',
  styleUrls: ['./app-footer.component.scss'],
})
export class AppFooterComponent {
  private router = inject(Router);

  showWizardButtons = false;
  menuRoutes: Route[] = [];
  activeMenuIndex = -1;
  private currentStep: string | null = null;

  constructor() {
    this.menuRoutes = this.getMenuRoutesFromConfig();
    this.updateState(this.router.url);
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: any) => {
      this.updateState(e.urlAfterRedirects);
    });
  }

  private getMenuRoutesFromConfig(): Route[] {
    return (this.router.config || [])
      .filter(r => !!r.data && (r.data as any)['showInMenu'])
      .map(r => r);
  }

  private updateState(url: string) {
    const segments = (url || '').split('/').filter(Boolean);
    const firstSegment = segments[0] || '';
    const secondSegment = segments[1] || null;

    this.currentStep = secondSegment;

    this.activeMenuIndex = this.menuRoutes.findIndex(r => r.path === firstSegment);
    if (this.activeMenuIndex === -1) {
      this.activeMenuIndex = this.menuRoutes.findIndex(r => (r.data as any)?.['pageId'] === firstSegment);
    }

    this.showWizardButtons = this.activeMenuIndex !== -1;
  }

  onContinuar() {
    const currentRoute = this.menuRoutes[this.activeMenuIndex];
    if (!currentRoute) return;

    const hasSteps = (currentRoute.data as any)?.['hasSteps'];
    const steps: string[] = (currentRoute.data as any)?.['steps'] ?? [];
    const defaultStep = (currentRoute.data as any)?.['defaultStep'] ?? (steps[0] ?? 'uso-vehiculo');

    if (hasSteps) {
      const step = this.currentStep ?? defaultStep;
      const idx = steps.indexOf(step);
      const nextIdx = idx >= 0 ? Math.min(idx + 1, steps.length - 1) : 0;

      if (nextIdx === steps.length - 1) {
        // si es el último step, avanzar a la siguiente ruta del menú
        this.navigateToNextMenuRoute();
        return;
      }

      const nextStep = steps[nextIdx] ?? defaultStep;
      this.router.navigate([`/${currentRoute.path}`, nextStep]);
      return;
    }

    this.navigateToNextMenuRoute();
  }

  onVolver() {
    const currentRoute = this.menuRoutes[this.activeMenuIndex];
    if (!currentRoute) return;

    const hasSteps = (currentRoute.data as any)?.['hasSteps'];
    const steps: string[] = (currentRoute.data as any)?.['steps'] ?? [];
    const defaultStep = (currentRoute.data as any)?.['defaultStep'] ?? (steps[0] ?? 'uso-vehiculo');

    if (hasSteps) {
      const step = this.currentStep ?? defaultStep;
      const idx = steps.indexOf(step);

      if (idx <= 0) {
        this.navigateToPrevMenuRoute();
        return;
      }

      const prevStep = steps[idx - 1];
      this.router.navigate([`/${currentRoute.path}`, prevStep]);
      return;
    }

    this.navigateToPrevMenuRoute();
  }

  private navigateToNextMenuRoute() {
    const nextIndex = this.activeMenuIndex + 1;
    if (nextIndex < 0 || nextIndex >= this.menuRoutes.length) return;
    const nextRoute = this.menuRoutes[nextIndex];
    this.navigateToRoute(nextRoute);
  }

  private navigateToPrevMenuRoute() {
    const prevIndex = this.activeMenuIndex - 1;
    if (prevIndex < 0 || prevIndex >= this.menuRoutes.length) return;
    const prevRoute = this.menuRoutes[prevIndex];
    this.navigateToRoute(prevRoute);
  }

  private navigateToRoute(route: Route) {
    if (!route) return;

    const hasSteps = (route.data as any)?.['hasSteps'];
    const defaultStep = (route.data as any)?.['defaultStep'] ?? 'uso-vehiculo';

    if (hasSteps) {
      this.router.navigate([`/${route.path}`, defaultStep]);
      return;
    }

    if (route.path) {
      this.router.navigate([`/${route.path}`]);
      return;
    }

    const found = this.menuRoutes.find(r => (r.data as any)?.['pageId'] === (route.data as any)?.['pageId']);
    if (found?.path) {
      const foundHasSteps = (found.data as any)?.['hasSteps'];
      if (foundHasSteps) {
        const def = (found.data as any)?.['defaultStep'] ?? 'uso-vehiculo';
        this.router.navigate([`/${found.path}`, def]);
      } else {
        this.router.navigate([`/${found.path}`]);
      }
    }
  }

  // utilidades para la plantilla
  get canGoNext(): boolean {
    return this.activeMenuIndex >= 0 && this.activeMenuIndex < this.menuRoutes.length - 1;
  }

  get canGoBack(): boolean {
    return this.activeMenuIndex > 0;
  }

  // Mostrar botón Volver solo si:
  // - no estamos en el primer item del menú (activeMenuIndex > 0)
  // - y, si la ruta tiene steps, estamos en un step distinto del default/first step
  get showBackButton(): boolean {
    // ocultar Volver siempre si estamos en el primer item del menú
    if (this.activeMenuIndex <= 0) return false;

    const currentRoute = this.menuRoutes[this.activeMenuIndex];
    if (!currentRoute) return false;

    const hasSteps = (currentRoute.data as any)?.['hasSteps'];
    const defaultStep = (currentRoute.data as any)?.['defaultStep'] ?? ((currentRoute.data as any)?.['steps']?.[0] ?? 'uso-vehiculo');

    if (hasSteps) {
      const step = this.currentStep ?? defaultStep;
      // mostrar Volver solo si no estamos en el primer/default step
      return step !== defaultStep;
    }

    // ruta sin steps: mostrar Volver si hay una ruta anterior en el menú
    return this.canGoBack;
  }
}
