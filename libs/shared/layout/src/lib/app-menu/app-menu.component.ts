import { BalSheet } from '@baloise/ds-angular';
import { CommonModule } from '@angular/common';
import { Component, computed, HostListener, inject, input, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { filter, map } from 'rxjs';
import { APP_PAGES } from '@mnv-autos-ng/models';
import { SidebarLayout, SidebarStep } from '@mnv-autos-ng/layout-state';
import { PageNavigationService } from '@mnv-autos-ng/navigation';

function buildRouteMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const page of APP_PAGES) {
    const basePath = page.path === '' ? '/' : `/${page.path}`;
    map[page.label] = basePath;
    map[page.id]    = basePath;
    for (const step of page.steps ?? []) {
      map[`${page.label}|${step.label}`] = `/${page.path}/${step.id}`;
      map[`${page.id}/${step.id}`]       = `/${page.path}/${step.id}`;
    }
  }
  return map;
}

const ROUTE_MAP = buildRouteMap();

@Component({
  selector: 'app-menu',
  standalone: true,
  templateUrl: './app-menu.component.html',
  styleUrls: ['./app-menu.component.css'],
  imports: [CommonModule, BalSheet, TranslateModule],
})
export class AppMenuComponent {
  private readonly sidebarLayout = inject(SidebarLayout);
  private readonly router        = inject(Router);
  private readonly pageNav       = inject(PageNavigationService);

  readonly inMenuBloqueado = input(false);
  readonly pageId          = input<string | undefined>(undefined);

  private readonly currentUrl: Signal<string> = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => (e as NavigationEnd).urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly steps: Signal<SidebarStep[]> = computed(() => {
    const fromService = this.sidebarLayout.steps();
    return fromService.length ? fromService : this.defaultSteps();
  });

  readonly activeStepId: Signal<string | null> = computed(() => {
    const url      = this.currentUrl();
    const segments = url.split('?')[0].split('#')[0]
                       .replace(/^\//, '').split('/').filter(Boolean);
    const parentSegment = segments[0] ?? '';
    const pageEntry = APP_PAGES.find(
      (p) => p.path === parentSegment || (p.path === '' && parentSegment === ''),
    );
    return pageEntry?.id ?? null;
  });

  readonly activeSubId: Signal<string | null> = computed(() => {
    const url      = this.currentUrl();
    const segments = url.split('?')[0].split('#')[0]
                       .replace(/^\//, '').split('/').filter(Boolean);
    return segments[1] ?? null;
  });

  isOpen = window.innerWidth > 1400;

  @HostListener('window:resize', ['$event'])
  onResize(_event?: Event): void {
    this.isOpen = window.innerWidth > 1400;
  }

  togglePanel(): void { this.isOpen = !this.isOpen; }

  isStepActive(step: SidebarStep): boolean {
    return this.pageIdForStep(step) === this.activeStepId();
  }

  isSubActive(sub: string): boolean {
    return this.activeSubId() === this.slugify(sub);
  }

  activeSubLabel(step: SidebarStep): string {
    if (!step.subSteps?.length) return '';
    if (this.isStepActive(step) && this.activeSubId()) {
      const match = step.subSteps.find((s) => this.slugify(s) === this.activeSubId());
      if (match) return match;
    }
    return step.subSteps[0];
  }

  isSubDone(_parentLabel: string, _subLabel: string): boolean {
    return false;
  }

  readonly activeStepIndex: Signal<number> = computed(() =>
    this.steps().findIndex((s) => this.isStepActive(s))
  );

  isStepDone(step: SidebarStep): boolean {
    const stepIdx = this.steps().findIndex((s) => s.label === step.label);
    return stepIdx < this.activeStepIndex() && this.activeStepIndex() >= 0;
  }

  onStepClick(step: SidebarStep, index: number): void {
    if (this.inMenuBloqueado()) return;
    const route = this.routeForStep(step);
    void this.router.navigateByUrl(route);
  }

  onSubStepClick(parent: SidebarStep, sub: string, event?: Event): void {
    event?.stopPropagation();
    if (this.inMenuBloqueado()) return;
    const route = this.routeForSubStep(parent, sub);
    void this.router.navigateByUrl(route);
  }

  trackByStepLabel(index: number, step: SidebarStep): string {
    return step.label;
  }

  private routeForStep(step: SidebarStep): string {
    return ROUTE_MAP[step.label]
        ?? ROUTE_MAP[this.pageIdForStep(step)]
        ?? `/${this.slugify(step.label)}`;
  }

  private routeForSubStep(parent: SidebarStep, sub: string): string {
    const labelKey = `${parent.label}|${sub}`;
    if (ROUTE_MAP[labelKey]) return ROUTE_MAP[labelKey];

    const pageId  = this.pageIdForStep(parent);
    const page    = APP_PAGES.find((p) => p.id === pageId);
    const stepDef = page?.steps?.find((s) => s.label === sub);
    if (page && stepDef) return `/${page.path}/${stepDef.id}`;

    return `${this.routeForStep(parent)}/${this.slugify(sub)}`;
  }

  private pageIdForStep(step: SidebarStep): string {
    const match = APP_PAGES.find(
      (p) => p.label === step.label || p.id === this.slugify(step.label),
    );
    return match?.id ?? this.slugify(step.label);
  }

  private defaultSteps(): SidebarStep[] {
    return APP_PAGES.filter((p) => p.showInMenu !== false).map((p) => ({
      label:      p.label,
      bloqueado:  false,
      activo:     false,
      completado: false,
      subSteps:   p.steps?.map((s) => s.label) ?? [],
    }));
  }

  private slugify(text: string): string {
    return (text ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '');
  }
}
