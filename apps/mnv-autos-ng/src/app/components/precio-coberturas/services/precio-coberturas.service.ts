import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from './../../../../../../../apps/mnv-autos-ng/src/environments/environment';
import { GarantiaOcupantes, PeriodoCobro } from '../models/precio-coberturas.model';


@Injectable({ providedIn: 'root' })
export class PrecioCoberturasService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = environment.apiPaths.autos;

    obtenerPeriodoCobro(): Observable<PeriodoCobro[]> {
        return this.http.get<PeriodoCobro[]>(`${this.apiUrl}/catalogo/periodo-cobro`);
    }

    obtenerGarantiaOcupantes(): Observable<GarantiaOcupantes> {
        // Campos de entrada fijos temporalmente según lo indicado en GDCARTPROY-2372
        const headers = new HttpHeaders({
            lineaNegocio: "AU02",
            combinacionComercial: "A1C001",
            codigoMediador: "310666",
            tipoVehiculo: "100",
            codigoCompania: "0001"
        })
        return this.http.get<GarantiaOcupantes>(`${this.apiUrl}/configuracion/garantia-ocupantes`, { headers });
    }
}
