import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateService, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { AppHeaderComponent, AppMenuComponent, AppFooterComponent } from '@mnv-autos-ng/layout'

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
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App {
  private readonly translate = inject(TranslateService);

  constructor() {
    this.translate.setDefaultLang('es');
    this.translate.use('es');
  }
}