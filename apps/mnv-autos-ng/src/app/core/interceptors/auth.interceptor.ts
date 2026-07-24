import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, throwError, switchMap } from 'rxjs';
import { isTokenExpired } from '../utils/jwt.helper';
import { AuthHttpService } from '../services/auth-http.service';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthHttpService);
  const token = sessionStorage.getItem('mnv_autos_auth_token');

  if (req.url.includes(environment.apiPaths.login)) {
    return next(req); // Passes the login call straight through without checking expiration
  }

  const evictAuthSession = (): void => {
    sessionStorage.removeItem('mnv_autos_auth_token');
    sessionStorage.removeItem('mnv_autos_refresh_token');
  };

  const cloneWithToken = (request: HttpRequest<unknown>, tokenStr: string): HttpRequest<unknown> => {
    return request.clone({
      headers: request.headers.set('Authorization', `Bearer ${tokenStr}`)
    });
  };

  // CONDITION 1: PROACTIVE SILENT REFRESH (Before request hits the wire)
  if (token && isTokenExpired(token)) {
    console.warn('[Auth Interceptor] Proactive check: Token expired. Requesting fresh technical token...');
    
    return authService.loginConAplicacionOrigen().pipe(
      switchMap((response) => {
        const newToken = response?._embedded?.access_token;
        const newRefresh = response?._embedded?.refresh_token;

        if (newToken) {
          sessionStorage.setItem('mnv_autos_auth_token', newToken);
          if (newRefresh) sessionStorage.setItem('mnv_autos_refresh_token', newRefresh);
          
          console.log('[Auth Interceptor] Silent technical token recovery successful. Sending original request.');
          return next(cloneWithToken(req, newToken));
        }
        
        evictAuthSession();
        return throwError(() => new Error('auth.errors.silentRefreshFailed'));
      }),
      catchError((refreshErr) => {
        console.error('[Auth Interceptor] Critical proactive authentication failure:', refreshErr);
        evictAuthSession();
        return throwError(() => refreshErr);
      })
    );
  }

  if (!token) {
    return next(req);
  }

  // CONDITION 2: REACTIVE SILENT REFRESH (Catching sudden mid-flight 401s)
  return next(cloneWithToken(req, token)).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        console.warn('[Auth Interceptor] Reactive check: Caught 401. Re-authenticating system account...');

        return authService.loginConAplicacionOrigen().pipe(
          switchMap((response) => {
            const newToken = response?._embedded?.access_token;
            const newRefresh = response?._embedded?.refresh_token;

            if (newToken) {
              sessionStorage.setItem('mnv_autos_auth_token', newToken);
              if (newRefresh) sessionStorage.setItem('mnv_autos_refresh_token', newRefresh);
              
              console.log('[Auth Interceptor] Recovered from server 401. Retrying original request.');
              return next(cloneWithToken(req, newToken));
            }
            
            evictAuthSession();
            return throwError(() => error);
          }),
          catchError((retryErr) => {
            console.error('[Auth Interceptor] Critical reactive authentication fallback failed:', retryErr);
            evictAuthSession();
            return throwError(() => error);
          })
        );
      }
      
      return throwError(() => error);
    })
  );
};