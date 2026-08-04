import { Component, inject, computed, Signal } from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { Location } from "@angular/common";
import { toSignal } from "@angular/core/rxjs-interop";
import { filter, map, startWith } from "rxjs/operators";
import { BalIcon, BalButton, BalBreakpointsService } from "@baloise/ds-angular";
import { SidebarLayout, SidebarItem } from "@mnv-autos-ng/layout-state";

type StepState = "completed" | "active" | "pending";

interface MenuItem extends SidebarItem {
  index: number;
  state: StepState;
  isLast: boolean;
  disabled: boolean;
}

@Component({
  selector: "app-menu",
  standalone: true,
  imports: [BalIcon, BalButton],
  templateUrl: "./app-menu.component.html",
  styleUrls: ["./app-menu.component.css"],
})
export class AppMenuComponent {
  private readonly sidebarLayout = inject(SidebarLayout);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly breakpoints = inject(BalBreakpointsService);

  // ⭐ ESTA ES LA VERSIÓN CORRECTA
  readonly isMobileOrTablet: Signal<boolean> = computed(() => {
    return this.breakpoints.mobile() || this.breakpoints.tablet();
  });

  readonly isDesktop: Signal<boolean> = computed(() => {
    return this.breakpoints.desktop() 
  });

  private readonly baseItems = computed(() => this.sidebarLayout.items() || []);

  private readonly currentUrl: Signal<string> = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly items: Signal<MenuItem[]> = computed(() => {
    const list = this.baseItems() || [];
    const rawUrl = this.currentUrl();

    const cleanUrl = rawUrl.split("?")[0].split("#")[0].replace(/\/$/, "").trim();
    const segments = cleanUrl.split("/").filter(Boolean);
    const baseSegment = segments[0] ?? "";
    const currentPath = baseSegment ? `/${baseSegment}` : "/";

    const currentIdx = list.findIndex((it) => {
      const cleanPath = it.path.split("?")[0].split("#")[0].replace(/\/$/, "").trim();
      return cleanPath === currentPath;
    });

    return list.map((it, i) => {
      let state: StepState = "pending";

      if (currentIdx !== -1) {
        if (i < currentIdx) state = "completed";
        else if (i === currentIdx) state = "active";
      }

      return {
        ...it,
        index: i + 1,
        state,
        isLast: i === list.length - 1,
        disabled: state === "pending",
      };
    });
  });

  hideMenu(): void {
    if (this.isMobileOrTablet()) {
      this.sidebarLayout.closeMenu();
    }
  }

  navigate(item: MenuItem): void {
    if (item.disabled) return;
    void this.router.navigateByUrl(item.path);
  }
}
