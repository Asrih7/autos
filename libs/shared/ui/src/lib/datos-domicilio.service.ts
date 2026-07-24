import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, finalize, map, Observable, of, shareReplay, switchMap, tap } from 'rxjs';
import { environment } from '../../../../../apps/mnv-autos-ng/src/environments/environment';
import { AuthHttpService } from '../../../../../apps/mnv-autos-ng/src/app/core/services/auth-http.service';
import { isTokenExpired } from '../../../../../apps/mnv-autos-ng/src/app/core/utils/jwt.helper';
import { DatosDomicilioModel } from './address.model';
import {
  ApiBuscarTipoViaRequest,
  ApiTipoVia,
  ApiBuscarProvinciaRequest,
  ApiProvincia,
  ApiLocalidadCodigoPostalRequest,
  ApiLocalidadCodigoPostal,
  ApiNormalizarDomicilioRequest,
  ApiNormalizarDomicilioResponse,
} from './datos-domicilio.dto';
import {
  mapToLocalidadOptions,
  mapToProvinciaOptions,
  mapToTipoViaOptions,
  mapNormalizedAddressResponse,
  mapProvinciaFromCodigoPostal,
} from './datos-domicilio.mapper';

@Injectable({ providedIn: 'root' })
export class DatosDomicilioService {
  private readonly http = inject(HttpClient);
  private readonly authHttp = inject(AuthHttpService);
  private readonly apiUrl = environment.apiPaths.autos;
  private authenticationInFlight$?: Observable<void>;
  private readonly addressDataByPostalCode = new Map<
    string,
    Observable<{
      localidades: Array<{ label: string; value: string }>;
      provincias: Array<{ label: string; value: string }>;
      provincia?: string;
    }>
  >();

  private readonly apiUser = environment.technicalCredentials.usuario;
  private readonly apiApplication = environment.sso.clientId || 'front-desktop';

  getTiposVia(): Observable<{ label: string; value: string }[]> {
    const payload: ApiBuscarTipoViaRequest = {
      usuario: this.apiUser,
      aplicacion: this.apiApplication,
      // El catálogo "1" devuelve documentos (NIF/CIF), no tipos de vía.
      // Se conserva el identificador funcional hasta que BDI confirme el
      // código numérico correcto del catálogo de vías.
      codigoCatalogo: 'TIPOVIA',
    };

    return this.authenticatedPost<ApiTipoVia[]>('/clientes/buscarTipoVia', payload)
      .pipe(
        map(mapToTipoViaOptions),
        catchError(() => of([])),
      );
  }

  getProvincias(descripcionProvincia = ''): Observable<{ label: string; value: string }[]> {
    const payload: ApiBuscarProvinciaRequest = {
      usuario: this.apiUser,
      aplicacion: this.apiApplication,
      descripcionProvincia,
    };

    return this.authenticatedPost<ApiProvincia[]>('/clientes/buscarProvincia', payload)
      .pipe(
        map(mapToProvinciaOptions),
        catchError(() => of([])),
      );
  }

  getLocalidades(codigoPostal: string): Observable<{ label: string; value: string }[]> {
    return this.getAddressData(codigoPostal).pipe(map((data) => data.localidades));
  }

  getProvinciaForCodigoPostalAsync(codigoPostal: string): Observable<string | undefined> {
    return this.getAddressData(codigoPostal).pipe(map((data) => data.provincia));
  }

  getAddressData(codigoPostal: string): Observable<{
    localidades: Array<{ label: string; value: string }>;
    provincias: Array<{ label: string; value: string }>;
    provincia?: string;
  }> {
    if (!codigoPostal || codigoPostal.length < 5) {
      return of({ localidades: [], provincias: [] });
    }

    const normalizedPostalCode = codigoPostal.slice(0, 5);
    const cached = this.addressDataByPostalCode.get(normalizedPostalCode);
    if (cached) {
      return cached;
    }

    const payload: ApiLocalidadCodigoPostalRequest = {
      codigoPostal: normalizedPostalCode,
      usuario: this.apiUser,
      aplicacion: this.apiApplication,
    };

    const request$ = this.authenticatedPost<ApiLocalidadCodigoPostal[]>('/clientes/buscarLocalidad', payload)
      .pipe(
        switchMap((items) => {
          const localidades = mapToLocalidadOptions(items);
          const provinciaBDI = mapProvinciaFromCodigoPostal(items);

          if (!provinciaBDI) {
            return of({ localidades, provincias: [] });
          }

          return this.getProvincias(provinciaBDI).pipe(
            map((provincias) => ({
              localidades,
              provincias,
              // El selector usa el valor devuelto por buscarProvincia, no el
              // literal lprovi de buscarLocalidad (pueden no coincidir).
              provincia: provincias[0]?.value ?? provinciaBDI,
            })),
          );
        }),
        catchError(() => of({ localidades: [], provincias: [] })),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

    this.addressDataByPostalCode.set(normalizedPostalCode, request$);
    return request$;
  }

  normalizeAddress(address: DatosDomicilioModel): Observable<DatosDomicilioModel> {
    const payload: ApiNormalizarDomicilioRequest = {
      tipoVia: address.tipoVia,
      via: address.nombreVia,
      numero: address.numero,
      restoDomicilio: '',
      poblacion: address.localidad,
      municipio: address.localidad,
      codigoPostal: address.codigoPostal,
      provincia: address.provincia,
      infCatastro: '',
      usuario: this.apiUser,
      aplicacion: this.apiApplication,
    };

    return this.authenticatedPost<ApiNormalizarDomicilioResponse>('/normalizar/domicilio', payload)
      .pipe(
        map((response: ApiNormalizarDomicilioResponse | null) => mapNormalizedAddressResponse(response, address)),
      );
  }

  private authenticatedPost<T>(path: string, payload: unknown): Observable<T> {
    return this.ensureTechnicalToken().pipe(
      switchMap(() => this.http.post<T>(`${this.apiUrl}${path}`, payload)),
    );
  }

  private ensureTechnicalToken(): Observable<void> {
    const token = sessionStorage.getItem('mnv_autos_auth_token');
    if (token && !isTokenExpired(token)) {
      return of(void 0);
    }

    if (!this.authenticationInFlight$) {
      this.authenticationInFlight$ = this.authHttp.loginConAplicacionOrigen().pipe(
        map((response) => {
          const accessToken = response?._embedded?.access_token;
          if (!accessToken) {
            throw new Error('auth.errors.tokenMissing');
          }
          return {
            accessToken,
            refreshToken: response?._embedded?.refresh_token,
          };
        }),
        tap(({ accessToken, refreshToken }) => {
          sessionStorage.setItem('mnv_autos_auth_token', accessToken);
          if (refreshToken) {
            sessionStorage.setItem('mnv_autos_refresh_token', refreshToken);
          }
        }),
        map(() => void 0),
        finalize(() => {
          this.authenticationInFlight$ = undefined;
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }

    return this.authenticationInFlight$!;
  }
}
