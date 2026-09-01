import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionCleanupService } from '../services/session-cleanup.service';

export const rootInitGuard: CanActivateFn = () => {
    const router = inject(Router);
    const cleanupService = inject(SessionCleanupService);

    cleanupService.clearSessionData();

    return router.createUrlTree(['/tu-cliente']);
};