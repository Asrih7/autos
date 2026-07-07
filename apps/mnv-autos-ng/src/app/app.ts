import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

// Helvetia
import { EstructuralFormularioModule, InputsModule } from '@helvetia-lib/helvetia-ng-core-lib';
// import { AppHeaderComponent } from './layout/app-header/app-header.component';
// import { AppMenuComponent } from './layout/app-menu/app-menu.component';
import { AppHeaderComponent, AppMenuComponent, AppFooterComponent } from '@mnv-autos-ng/layout'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    TranslateModule,
    InputsModule,
    EstructuralFormularioModule,
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