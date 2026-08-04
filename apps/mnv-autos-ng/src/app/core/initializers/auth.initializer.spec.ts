import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initializeAuthentication } from './auth.initializer';
import { ApiAuthResponse } from '../dtos/auth.dto';
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

describe('Authentication Initializer', () => {
  let httpMock: HttpTestingController;
  
  const loginUrl = environment.apiPaths.login;

  beforeEach(() => {
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should request and store tokens securely in sessionStorage on startup', () => {
    TestBed.runInInjectionContext(() => {
      initializeAuthentication().subscribe();
    });

    const req = httpMock.expectOne(loginUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
     usuario: 'AC_ASIST_PYMES',
        password: 'Entra2026**'
    });

    const mockApiResponse: ApiAuthResponse = {
      _embedded: {
        destino: null,
        contenedor: null,
        user_info: {
          username: "agentePM1Col",
          nif: null,
          fullName: "",
          email: null,
          roles: ["ROLE_USER"],
          tema: null,
          embebido: null,
          idioma: "ES"
        },
        access_token: "mock-valid-jwt-token-string",
        refresh_token: "mock-valid-refresh-token-string"
      },
      _response: {
        status: 200,
        timestamp: {
          init: "2026-07-23T23:43:54.322+02:00",
          end: "2026-07-23T23:43:54.457+02:00"
        },
        duration: 135,
        path: "/auth/login",
        api: "https://mnv-seguridad-sb.rosa-test-back.caser.local/mnv-seguridad-sb/auth/login",
        version: "1.0.19",
        trace_id: "eebd7bcb555181258bcd3d704d47be2f",
        span_id: "6e27cc9eb86698a5"
      }
    };

    req.flush(mockApiResponse);

    expect(sessionStorage.getItem('mnv_autos_auth_token')).toBe('mock-valid-jwt-token-string');
    expect(sessionStorage.getItem('mnv_autos_refresh_token')).toBe('mock-valid-refresh-token-string');
  });

  it('should degrade gracefully and clear tokens if the background API call returns a server error', () => {
    TestBed.runInInjectionContext(() => {
      initializeAuthentication().subscribe();
    });

    const req = httpMock.expectOne(loginUrl);
    req.flush('Authentication Error', { status: 403, statusText: 'Forbidden' });

    expect(sessionStorage.getItem('mnv_autos_auth_token')).toBeNull();
    expect(sessionStorage.getItem('mnv_autos_refresh_token')).toBeNull();
  });
});