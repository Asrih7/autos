import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { appRoutes } from './app.routes';
import { environment } from '../environments/environment';
import { provideStoreConfigOnEnvironment } from '@archit-lib-helvetiang/core/ocp-config';
import { HeOCPSSOProvider } from '@archit-lib-helvetiang/core/ocp-sso';
import { provideBaloiseDesignSystem } from '@baloise/ds-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes),
    provideHttpClient(),
    HeOCPSSOProvider(),
    provideStoreConfigOnEnvironment(environment as any),
    provideBaloiseDesignSystem({
      defaults: {
        region: 'CH',
      },
    }),
  ],
};
