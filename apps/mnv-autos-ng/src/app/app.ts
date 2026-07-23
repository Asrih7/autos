import { Component, inject, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateService, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { AppHeaderComponent, AppMenuComponent, AppFooterComponent } from '@mnv-autos-ng/layout'
import { SidebarLayout } from '@mnv-autos-ng/layout-state';
import { BalButton, BalBreakpointsService } from '@baloise/ds-angular';

export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    TranslateModule,
    AppHeaderComponent,
    AppMenuComponent,
    AppFooterComponent,
    BalButton
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App {
  private readonly translate = inject(TranslateService);
  protected sidebarLayout = inject(SidebarLayout);
  private readonly breakpoints = inject(BalBreakpointsService);

  readonly isMobileOrTablet = computed(() =>
    this.breakpoints.mobile() || this.breakpoints.tablet()
  );

  constructor() {
    this.translate.setDefaultLang('es');
    this.translate.use('es');
  }
}
