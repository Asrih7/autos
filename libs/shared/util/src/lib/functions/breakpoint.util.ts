import { inject, signal, Signal, PLATFORM_ID, DestroyRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export function useIsMobile(maxWidth = 767): Signal<boolean> {
  const isMobileSignal = signal<boolean>(false);
  const platformId = inject(PLATFORM_ID);
  const destroyRef = inject(DestroyRef);

  if (isPlatformBrowser(platformId)) {
    const mediaQueryList = window.matchMedia(`(max-width: ${maxWidth}px)`);
    
    isMobileSignal.set(mediaQueryList.matches);

    const listener = (event: MediaQueryListEvent) => {
      isMobileSignal.set(event.matches);
    };

    mediaQueryList.addEventListener('change', listener);

    destroyRef.onDestroy(() => {
      mediaQueryList.removeEventListener('change', listener);
    });
  }

  return isMobileSignal.asReadonly();
}
