import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class SessionCleanupService {
    clearSessionData(): void {
        sessionStorage.removeItem('mnv_autos_tu_cliente_state');
        sessionStorage.removeItem('mnv_autos_vehiculo_state');
        sessionStorage.removeItem('mnv_autos_uso_conductores_state');
        sessionStorage.removeItem('mnv_autos_precio_coberturas_state');
    }
}