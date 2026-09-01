import { Injectable, inject, computed, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { Router, NavigationEnd } from "@angular/router";
import { filter, map } from "rxjs";

export interface PageBlueprint {
  pageId: string;
  previousPageUrl: string;
  previousPageLabel: string;
  nextPageUrl: string;
  nextPageLabel?: string;
  beforeNavigateNext?: () => boolean | Promise<boolean>;
  canContinueNext?: () => boolean;
  showNextButton?: () => boolean;
  useCustomClass?: string;
}

@Injectable({ providedIn: "root" })
export class PageNavigationService {
  private readonly router = inject(Router);

  readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly activePageConfig = signal<PageBlueprint | null>(null);
  readonly currentStepCallback = signal<((data: unknown) => void) | null>(null);
  readonly activePageId = computed(() => {
    const url = this.currentUrl();
    const segments = url.split("/").filter(Boolean);
    return segments[0] ?? "";
  });

  readonly showBackButton = computed(() => {
    const pageId = this.activePageId();
    if (pageId==="initial") return false;
    return pageId !== "tu-cliente" && pageId !== "";
  });

  readonly backButtonLabel = computed<string>(() => {
    const config = this.activePageConfig();
    if (!config?.previousPageLabel) return "Volver";
    return `Volver a ${config.previousPageLabel.toLowerCase()}`;
  });

  readonly showNextButton = computed<boolean>(() => {
    const config = this.activePageConfig();
    if (!config?.showNextButton) return true;
    return config.showNextButton();
  });

  readonly useCustomClass = computed(
    () => this.activePageConfig()?.useCustomClass ?? ''
  );

  readonly nextButtonLabel = computed<string>(() => {
    const config = this.activePageConfig();
    if (!config?.nextPageLabel) return "Continuar";
    return config.nextPageLabel;
  });

  readonly canContinueNext = computed<boolean>(() => {
    const config = this.activePageConfig();
    if (!config?.canContinueNext) return true;
    return config.canContinueNext();
  });

  navigateBack(): void {
    const config = this.activePageConfig();
    if (config) {
      void this.router.navigateByUrl(config.previousPageUrl);
    } else {
      void this.router.navigate(["/tu-cliente"]);
    }
  }

  async navigateNext(): Promise<void> {
    const config = this.activePageConfig();
    const activePageId = this.activePageId();

    if (["vehiculos", "initial"].includes(activePageId)) {
      this.currentStepCallback()?.({
        status: "NEXT_CLICKED",
      });
    }

    if (!config) {
      if (this.router.url.includes("/tu-cliente")) {
        await this.router.navigate(["/vehiculos"]);
      }

      return;
    }

    if (!config.nextPageUrl?.trim()) {
      console.warn("Último paso alcanzado. No hay navegación siguiente.");
      return;
    }

    const canNavigate =
      !config.beforeNavigateNext ||
      (await config.beforeNavigateNext());

    if (!canNavigate) {
      return;
    }

    await this.router.navigateByUrl(config.nextPageUrl);
  }
}
