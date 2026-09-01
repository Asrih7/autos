import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, map, of } from "rxjs";
import { GridItemSelector } from "@mnv-autos-ng/models";
import { environment } from "../../../../environments/environment";
import {
  SEGURO_ANTERIOR_OPCIONES,
} from "../data/mock-seguro-anterior";
import { SeguroAnteriorOpcion, SelectOpcion } from "../models/seguro-anterior.model";

@Injectable({ providedIn: "root" })
export class SeguroAnteriorService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiPaths.autos;

  getOpciones(): SeguroAnteriorOpcion[] {
    return SEGURO_ANTERIOR_OPCIONES;
  }

  getCompaniaAseguradoras(): Observable<GridItemSelector[]> {
    return this.http.get<any[]>(`${this.apiUrl}/catalogo/compania-aseguradoras`).pipe(
      map(items => items.map(item => ({
        id: item.codigo,
        nombre: item.descripcion,
        logo: this.getLogoForCompania(item.descripcion)
      })))
    );
  }

  getAniosCompaniaAnterior(): Observable<SelectOpcion[]> {
    return this.http.get<any[]>(`${this.apiUrl}/catalogo/anios-compania-anterior`).pipe(
      map(items => items.map(item => ({
        value: item.codigo,
        label: item.descripcion
      })))
    );
  }

  getNumeroSiniestros(): Observable<SelectOpcion[]> {
    return this.http.get<any[]>(`${this.apiUrl}/catalogo/numero-siniestros`).pipe(
      map(items => items.map(item => ({
        value: item.codigo,
        label: item.descripcion
      })))
    );
  }

  /**
   * Resolves the logo from the insurer description returned by the catalog.
   * The catalog code (for example, C0109) is not the logo name, so matching
   * must be done against `descripcion`, not `codigo`.
   */
  private getLogoForCompania(descripcion: string | null | undefined): string {
    const normalizedDescripcion = this.normalizeCompaniaName(descripcion);

    const logos: Array<{ aliases: string[]; path: string }> = [
      { aliases: ['allianz'], path: 'assets/logos/allianz.png' },
      { aliases: ['direct seguros', 'direct'], path: 'assets/logos/direct.png' },
      { aliases: ['axa'], path: 'assets/logos/axa.png' },
      { aliases: ['fenix directo', 'fenix'], path: 'assets/logos/fenix.png' },
      { aliases: ['fiatc'], path: 'assets/logos/fiatc.png' },
      { aliases: ['genesis'], path: 'assets/logos/genesis.png' },
      { aliases: ['groupama'], path: 'assets/logos/groupama.png' },
      { aliases: ['liberty'], path: 'assets/logos/liberty.png' },
      { aliases: ['linea directa'], path: 'assets/logos/linea-directa.png' },
      { aliases: ['mapfre'], path: 'assets/logos/mapfre.png' },
      { aliases: ['mutua madrilena'], path: 'assets/logos/mutua-madrilena.png' },
      { aliases: ['pelayo'], path: 'assets/logos/pelayo.png' },
      { aliases: ['reale'], path: 'assets/logos/reale.png' },
      { aliases: ['zurich'], path: 'assets/logos/zurich.png' },
       { aliases: ['caser'], path: 'assets/logos/caser.png' }
    ];

    const matchingLogo = logos
      .flatMap(({ aliases, path }) => aliases.map(alias => ({ alias, path })))
      .sort((a, b) => this.normalizeCompaniaName(b.alias).length - this.normalizeCompaniaName(a.alias).length)
      .find(({ alias }) => normalizedDescripcion.includes(this.normalizeCompaniaName(alias)));

    return matchingLogo?.path ?? 'assets/logos/noexiste.jpg';
  }

  private normalizeCompaniaName(value: string | null | undefined): string {
    return (value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }
}
