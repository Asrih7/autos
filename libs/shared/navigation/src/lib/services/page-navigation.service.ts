import { Injectable, inject, computed, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { Router, NavigationEnd } from "@angular/router";
import { filter, map } from "rxjs";

export interface PageBlueprint {
  pageId: string;
  previousPageUrl: string;
  previousPageLabel: string;
  nextPageUrl: string;
}

@Injectable({ providedIn: "root" })
export class PageNavigationService {
  private readonly router = inject(Router);
  //TODO: Continuar button enable logic
  // private readonly globalState = inject(GlobalStateService);

  readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly activePageConfig = signal<PageBlueprint | null>(null);
  readonly activePageId = computed(() => {
    const url = this.currentUrl();
    const segments = url.split("/").filter(Boolean);
    return segments[0] ?? "";
  });

  readonly showBackButton = computed(() => {
    const pageId = this.activePageId();
    return pageId !== "tu-cliente" && pageId !== "";
  });

  readonly backButtonLabel = computed<string>(() => {
    const config = this.activePageConfig();
    if (!config?.previousPageLabel) return "Volver"; // Fallback text safety guard

    return `Volver a ${config.previousPageLabel.toLowerCase()}`;
  });

  //TODO: Continuar button enable logic
  // readonly isNextButtonEnabled = computed<boolean>(() => {
  //   const pageId = this.activePageId();

  //   switch (pageId) {
  //     case "tu-cliente":
  //       return true; // always allowed to move forward
  //     case "vehiculos":
  //       return this.globalState.isVehiculoPageValid();
  //     case "uso-conductores":
  //       return this.globalState.isConductoresPageValid();
  //     default:
  //       return true; //fallback
  //   }
  // });

  navigateBack(): void {
    const config = this.activePageConfig();

    if (config) {
      void this.router.navigateByUrl(config.previousPageUrl);
    } else {
      void this.router.navigate(["/tu-cliente"]);
    }
  }

  navigateNext(): void {
    const invoke = async () => {
      const config = this.activePageConfig();

      if (config) {
        await this.router.navigateByUrl(config.nextPageUrl);
      } else {
        if (this.router.url.includes("/tu-cliente")) {
          await this.router.navigate(["/vehiculos"]);
        }
      }
    };

    // If a beforeNavigate callback is registered, call it and respect its result
    if (this.beforeNavigateCallback) {
      Promise.resolve(this.beforeNavigateCallback(this.router.url)).then((shouldProceed) => {
        if (shouldProceed) {
          void invoke();
        }
      });
    } else {
      void invoke();
    }
  }

  private beforeNavigateCallback?: (currentUrl: string) => Promise<boolean> | boolean;

  setBeforeNavigateCallback(cb: (currentUrl: string) => Promise<boolean> | boolean): void {
    this.beforeNavigateCallback = cb;
  }

  clearBeforeNavigateCallback(): void {
    this.beforeNavigateCallback = undefined;
  }
}
