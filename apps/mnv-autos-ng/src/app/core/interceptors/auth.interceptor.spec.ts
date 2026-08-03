import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { authInterceptor } from './auth.interceptor';
import { environment } from '../../../environments/environment';

vi.mock('../../../environments/environment', () => ({
  environment: {
    production: false,
    apiPaths: {
      login: '/mnv-seguridad-sb/auth/login',
      vehiculo: '/mnv-autos-sb/autos'
    },
    technicalCredentials: {
     usuario: 'AC_ASIST_PYMES',
        password: 'Entra2026**'
    }
  }
}));

describe('AuthInterceptor Pipeline Tests', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;

  const loginUrl = environment.apiPaths.login;

  const createValidMockToken = (): string => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const futureEpoch = Math.floor(Date.now() / 1000) + 3600;
    const payload = btoa(JSON.stringify({ sub: 'agentePM1Col', exp: futureEpoch })).replace(/=/g, '');
    return `${header}.${payload}.mockSignature`;
  };

  const createExpiredMockToken = (): string => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const pastEpoch = Math.floor(Date.now() / 1000) - 3600;
    const payload = btoa(JSON.stringify({ sub: 'agentePM1Col', exp: pastEpoch })).replace(/=/g, '');
    return `${header}.${payload}.mockSignature`;
  };

  beforeEach(() => {
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting()
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should append a Bearer token in the Authorization header when a valid token exists', () => {
    const validToken = createValidMockToken();
    sessionStorage.setItem('mnv_autos_auth_token', validToken);

    httpClient.get('/autos/vehiculo/busqueda').subscribe();

    const req = httpMock.expectOne('/autos/vehiculo/busqueda');
    expect(req.request.headers.has('Authorization')).toBe(true);
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${validToken}`);
    
    req.flush({});
  });

  it('should skip appending headers if no auth token is active inside sessionStorage', () => {
    httpClient.get('/autos/vehiculo/busqueda').subscribe();

    const req = httpMock.expectOne('/autos/vehiculo/busqueda');
    expect(req.request.headers.has('Authorization')).toBe(false);
    
    req.flush({});
  });

  it('should allow the login endpoint request to pass through completely unhindered and untouched', () => {
    sessionStorage.setItem('mnv_autos_auth_token', createExpiredMockToken());

    httpClient.post(loginUrl, { usuario: 'test' }).subscribe();

    const req = httpMock.expectOne(loginUrl);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should trigger proactive silent re-authentication before sending if the active token is expired', () => {
    sessionStorage.setItem('mnv_autos_auth_token', createExpiredMockToken());

    httpClient.get('/autos/vehiculo/busqueda').subscribe();

    const loginReq = httpMock.expectOne(loginUrl);
    expect(loginReq.request.method).toBe('POST');
    
    loginReq.flush({
      _embedded: {
        access_token: 'brand-new-recovered-token-string'
      }
    });

    const originalReq = httpMock.expectOne('/autos/vehiculo/busqueda');
    expect(originalReq.request.headers.get('Authorization')).toBe('Bearer brand-new-recovered-token-string');
    originalReq.flush({});

    expect(sessionStorage.getItem('mnv_autos_auth_token')).toBe('brand-new-recovered-token-string');
  });

  it('should handle a reactive silent refresh upon catching a sudden mid-flight 401 error', () => {
    const originalValidToken = createValidMockToken();
    sessionStorage.setItem('mnv_autos_auth_token', originalValidToken);

    httpClient.get('/autos/vehiculo/busqueda').subscribe();

    const initialReq = httpMock.expectOne('/autos/vehiculo/busqueda');
    expect(initialReq.request.headers.get('Authorization')).toBe(`Bearer ${originalValidToken}`);
    
    initialReq.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    const refreshReq = httpMock.expectOne(loginUrl);
    expect(refreshReq.request.method).toBe('POST');
    refreshReq.flush({
      _embedded: {
        access_token: 'reactive-recovered-token-string'
      }
    });

    const retryReq = httpMock.expectOne('/autos/vehiculo/busqueda');
    expect(retryReq.request.headers.get('Authorization')).toBe('Bearer reactive-recovered-token-string');
    retryReq.flush({});

    expect(sessionStorage.getItem('mnv_autos_auth_token')).toBe('reactive-recovered-token-string');
  });
});