import { InjectionToken } from '@angular/core';
import { AppPageDefinition } from '../../../../models/src/lib/navigation.model';

export const PAGE_NAVIGATION_CONFIG = new InjectionToken<AppPageDefinition[]>(
    'PAGE_NAVIGATION_CONFIG'
);
