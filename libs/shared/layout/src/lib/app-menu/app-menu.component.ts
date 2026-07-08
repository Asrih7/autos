import { Component, inject, computed, Signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Location } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs/operators';
import {  BalIcon } from '@baloise/ds-angular';
import { SidebarLayout, SidebarItem } from '@mnv-autos-ng/layout-state';

type StepState = 'completed' | 'active' | 'pending';

interface MenuItem extends SidebarItem {
  index: number;
  state: StepState;
  isLast: boolean;
}

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [  BalIcon],
  templateUrl: './app-menu.component.html',
  styleUrls: ['./app-menu.component.css'],
})
export class AppMenuComponent {
  private readonly sidebarLayout = inject(SidebarLayout);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  private readonly baseItems = computed(() => this.sidebarLayout.items() || []);

  // 🔑 This is the fix: router.url as a real reactive signal.
  // Without this, `items` below never recomputes on navigation.
  private readonly currentUrl: Signal<string> = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly items: Signal<MenuItem[]> = computed(() => {
    const list = this.baseItems() || [];
    const url = this.currentUrl();
    const currentFirstSegment = url.split('/').filter(Boolean)[0] || '';
    const currentPath = currentFirstSegment ? `/${currentFirstSegment}` : '/';

    const currentIdx = list.findIndex(it => it.path === currentPath);

    return list.map((it, i) => {
      let state: StepState = 'pending';
      if (currentIdx !== -1) {
        if (i < currentIdx) state = 'completed';
        else if (i === currentIdx) state = 'active';
      }

      return {
        ...it,
        index: i + 1,
        state,
        isLast: i === list.length - 1,
      };
    });
  });

  goBack(): void {
    this.location.back();
  }

  navigate(item: MenuItem): void {
    void this.router.navigateByUrl(item.path);
  }
}