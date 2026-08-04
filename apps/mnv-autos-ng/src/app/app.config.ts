import {
  ApplicationConfig,
  importProvidersFrom,
  provideBrowserGlobalErrorListeners,
  provideAppInitializer,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { appRoutes } from './app.routes';
import { environment } from '../environments/environment';
import { provideStoreConfigOnEnvironment } from '@archit-lib-helvetiang/core/ocp-config';
import { HeOCPSSOProvider } from '@archit-lib-helvetiang/core/ocp-sso';
import { provideBaloiseDesignSystem } from '@baloise/ds-angular';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { initializeAuthentication } from './core/initializers/auth.initializer';

export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

import * as brandIcons from '@baloise/ds-brand-icons';

const { balBrandIconCarCrashWithAnimalGreen, balBrandIconSomeOther } = brandIcons as any;

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes, withComponentInputBinding()),
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    importProvidersFrom(
      TranslateModule.forRoot({
        defaultLanguage: 'es',
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient],
        },
      })
    ),
    HeOCPSSOProvider(),
    provideStoreConfigOnEnvironment(environment as any),
    provideBaloiseDesignSystem({
      defaults: {
        icons: {
          balBrandIconCarCrashWithAnimalGreen,
          balBrandIconSomeOther,
        },
        language: 'es',
      },
    }),
    provideAppInitializer(() => initializeAuthentication()),
  ],
};
