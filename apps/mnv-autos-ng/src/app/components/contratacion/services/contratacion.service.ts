import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from './../../../../../../../apps/mnv-autos-ng/src/environments/environment';
import { FormaPago } from '../models/contratacion.model';

@Injectable({ providedIn: 'root' })
export class ContratacionService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = environment.apiPaths.autos;

    obtenerFormaPago(): Observable<FormaPago[]> {
        const headers = new HttpHeaders({
            lineaNegocio: "AU02"
        })
        return this.http.get<FormaPago[]>(`${this.apiUrl}/catalogo/forma-pago`, { headers });
    }
}
