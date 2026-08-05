import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import { environment } from 'apps/mnv-autos-ng/src/environments/environment';
import {
  ApiClienteDatosPersonalesRequest,
  ApiDatosBusquedaCliente,
  ApiNormalizarDocumentoRequest,
  ApiNormalizarDocumentoResponse,
  ApiNormalizarNombreRequest,
  ApiNormalizarNombreResponse,
} from '../dto/cliente-busqueda.dto';
import { mapApiDatosBusquedaCliente } from '../mapper/cliente-busqueda.mapper';
import type { DatosPersonaModel } from '../../datos-persona/models/datos-persona.model';

@Injectable({ providedIn: 'root' })
export class ClienteBusquedaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiPaths.autos;

  /******************************************************************
   * 🔥 MOCKS ACTIVABLES
   * Cambia MOCKS = true para activar los mocks y evitar errores 500
   ******************************************************************/
  private readonly MOCKS = true;

  /******************************************************************
   * 🟦 1. BUSCAR CLIENTE
   ******************************************************************/
  // FIX: recibe también el tipoDocumento ya detectado en normalizarDocumento()
  // para poder informarlo correctamente en la tarjeta de cliente (antes se
  // intentaba derivar de `tipoPersona`, ver mapper).
  buscarCliente(
    documento: string,
    tipoDocumento: string,
  ): Observable<ReturnType<typeof mapApiDatosBusquedaCliente>> {
    if (this.MOCKS) {
      // ⭐ Caso: NIF encontrado
      if (documento === '12345678Z') {
        const mockResponse: ApiDatosBusquedaCliente = {
          clientes: [
            {
              clienId: 1001,
              documento: '12345678Z',
              tipoPersona: 'F',
              nombre: 'Carlos',
              apell1: 'García',
              apell2: 'López',
              razonSocial: '',
              fecNac: '1985-06-12',
              indSexo: 'H',
            },
          ],
          prospectoClientes: [],
        };
        return of(mockResponse).pipe(map((response) => mapApiDatosBusquedaCliente(response, tipoDocumento)));
      }

      // ⭐ Caso: NIF NO encontrado
      const mockNotFound: ApiDatosBusquedaCliente = {
        clientes: [],
        prospectoClientes: [],
      };
      return of(mockNotFound).pipe(map((response) => mapApiDatosBusquedaCliente(response, tipoDocumento)));
    }

    // ⭐ Código real
    const payload: ApiClienteDatosPersonalesRequest = {
      documento,
      usuario: environment.technicalCredentials.usuario,
      aplicacion: environment.sso.clientId || 'front-desktop',
      consultarProspect: 'true',
      idioma: 'ES',
    };

    return this.http.post<ApiDatosBusquedaCliente>(`${this.apiUrl}/clientes/buscarDatosCliente`, payload).pipe(
      map((response) => mapApiDatosBusquedaCliente(response, tipoDocumento)),
    );
  }

  /******************************************************************
   * 🟩 2. NORMALIZAR DOCUMENTO
   ******************************************************************/
  // FIX: ahora devuelve también `tipoDocumento` (antes se detectaba y se
  // descartaba, obligando al mapper de buscarCliente a "adivinarlo" a partir
  // de un campo equivocado).
  normalizarDocumento(documento: string): Observable<{ documento: string; tipoDocumento: string }> {
    if (this.MOCKS) {
      // ⭐ Documento válido
      if (documento === '12345678Z') {
        const mockResponse: ApiNormalizarDocumentoResponse = {
          numeroNormalizado: '12345678',
          letraNormalizado: 'Z',
          codigoError: 0,
          desError: '',
          tipoDocumento: 'NIF',
        };
        return of({ documento: '12345678Z', tipoDocumento: mockResponse.tipoDocumento ?? 'NIF' });
      }

      // ⭐ Documento inválido
      const mockError: ApiNormalizarDocumentoResponse = {
        codigoError: 101,
        desError: 'Documento no válido',
      };
      throw new Error(mockError.desError);
    }

    // ⭐ Código real
    const value = documento.trim().toUpperCase();
    // FIX: la letra de control es siempre el último carácter cuando lo hay;
    // el regex anterior (`/^(.*?)([A-Z])?$/`, no-greedy) no garantizaba ese
    // reparto y podía dejar `numero` vacío o con la letra incluida.
    const lastChar = value.slice(-1);
    const hasTrailingLetter = /^[A-Z]$/.test(lastChar);
    const numero = hasTrailingLetter ? value.slice(0, -1) : value;
    const letra = hasTrailingLetter ? lastChar : '';
    const tipoDocumento = this.detectDocumentType(value);
    const payload: ApiNormalizarDocumentoRequest = {
      tipoDocumento,
      numero,
      letra,
      usuario: environment.technicalCredentials.usuario,
      aplicacion: environment.sso.clientId || 'front-desktop',
    };

    return this.http
      .post<ApiNormalizarDocumentoResponse>(`${this.apiUrl}/normalizar/documento`, payload)
      .pipe(
        map((response) => {
          if (response.codigoError && response.codigoError !== 0) {
            throw new Error(response.desError || 'Documento no válido');
          }

          return {
            documento: `${response.numeroNormalizado ?? numero}${response.letraNormalizado ?? letra}`,
            tipoDocumento: response.tipoDocumento ?? tipoDocumento,
          };
        }),
      );
  }

  /******************************************************************
   * 🟧 3. NORMALIZAR NOMBRE
   ******************************************************************/
  normalizarNombre(persona: DatosPersonaModel): Observable<DatosPersonaModel> {
    if (this.MOCKS) {
      // ⭐ Nombre normalizado correctamente
      const mockResponse: ApiNormalizarNombreResponse = {
        nombre: persona.firstName.toUpperCase(),
        apellido1: persona.firstSurname.toUpperCase(),
        apellido2: persona.secondSurname.toUpperCase(),
        error: 0,
      };

      return of({
        ...persona,
        firstName: mockResponse.nombre!,
        firstSurname: mockResponse.apellido1!,
        secondSurname: mockResponse.apellido2!,
      });
    }

    // ⭐ Código real
    if (persona.documentType === 'cif') {
      return of(persona);
    }

    const payload: ApiNormalizarNombreRequest = {
      nombre: persona.firstName,
      apellido1: persona.firstSurname,
      apellido2: persona.secondSurname,
      sexo: '',
      usuario: environment.technicalCredentials.usuario,
      aplicacion: environment.sso.clientId || 'front-desktop',
    };

    return this.http.post<ApiNormalizarNombreResponse>(`${this.apiUrl}/normalizar/nombre`, payload).pipe(
      map((response) => {
        if (response.error && response.error !== 0) {
          throw new Error('Nombre no válido');
        }

        return {
          ...persona,
          firstName: response.nombre?.trim() || persona.firstName,
          firstSurname: response.apellido1?.trim() || persona.firstSurname,
          secondSurname: response.apellido2?.trim() || persona.secondSurname,
        };
      }),
    );
  }

  private detectDocumentType(documento: string): string {
    if (/^[XYZ]/.test(documento)) return 'NIE';
    if (/^[A-W]/.test(documento)) return 'CIF';
    if (/^\d/.test(documento)) return 'DNI';
    return 'NRT';
  }
}
