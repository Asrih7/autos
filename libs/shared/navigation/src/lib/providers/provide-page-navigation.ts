import { Provider } from '@angular/core';
import { AppPageDefinition } from '../../../../models/src/lib/navigation.model';
import { PAGE_NAVIGATION_CONFIG } from '../tokens/page-navigation.token';

export function providePageNavigation(
    pages: AppPageDefinition[]
): Provider {
    return {
        provide: PAGE_NAVIGATION_CONFIG,
        useValue: pages,
    };
}