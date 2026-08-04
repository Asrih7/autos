import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiAuthResponse } from '../dtos/auth.dto';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthHttpService {
  private readonly http = inject(HttpClient);
  private readonly loginUrl = environment.apiPaths.login;

  loginConAplicacionOrigen(): Observable<ApiAuthResponse> {
    const payload = {
      usuario: environment.technicalCredentials.usuario,
      password: environment.technicalCredentials.password
    };

    return this.http.post<ApiAuthResponse>(this.loginUrl, payload);
  }
}
