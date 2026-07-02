// apps/mnv-autos-ng/src/app/components/uso-conductores/steps/intervinientes/intervinientes.component.ts
import { Component, OnInit, Signal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

/* Baloise components (ajusta nombres si tu paquete exporta otros) */
import {
  BalIcon,
  BalSelect,
  BalSelectOption,
  BalDate,
  BalInput,
  BalButton
} from '@baloise/ds-angular';

/* Componente de dirección reutilizado (página 1) */
import { DireccionTomadorComponent } from './components/direccion-tomador/direccion-tomador.component';

import { BdiService } from '../../services/bdi.service';
import { SisnetService } from '../../services/sisnet.service';
/* ------------------------------------------------------------------ */

import { Persona } from '../../models/persona.model';
import { DireccionModel } from '../../models/direccion.model';

@Component({
  selector: 'app-intervinientes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BalIcon,
    BalSelect,
    BalSelectOption,
    BalDate,
    BalInput,
    BalButton,
    DireccionTomadorComponent
  ],
  templateUrl: './intervinientes.html',
  styleUrls: ['./intervinientes.scss'],
  host: { class: 'intervinientes-host' },
})
export class IntervinientesComponent implements OnInit {
  /* ----- Flags UI ----- */
  tomadorEsPropietario = signal(true);
  tomadorEsConductorHabitual = signal(true);

  /* Mostrar la sección de dirección del propietario cuando tomadorEsPropietario === false */
  showDireccionPropietario = signal(false);

  /* Dirección guardada del propietario (si se introduce) */
  propietarioDireccion = signal<DireccionModel | null>(null);

  /* Listas cargadas desde servicios */
  documentos$!: Observable<{ label: string; value: string }[]>;
  paises$!: Observable<{ label: string; value: string }[]>;
  tiposCarnet$!: Observable<{ label: string; value: string }[]>;

  /* Número máximo/permitido de conductores ocasionales (desde Sisnet) */
  maxConductoresOcasionales!: Signal<number>;

  /* Modelos */
  tomador: Persona = {
    documento: 'NIF',
    numeroDocumento: '',
    pais: 'ES',
    fechaNacimiento: null,
    tipoCarnet: 'B',
    fechaObtencionCarnet: null,
    edadObtencionCarnet: undefined,
  };

  propietario: Persona = {
    documento: 'NIF',
    numeroDocumento: '',
    pais: 'ES',
  };

  conductorHabitual: Persona = {
    documento: 'NIF',
    numeroDocumento: '',
    pais: 'ES',
    fechaNacimiento: null,
    tipoCarnet: 'B',
    fechaObtencionCarnet: null,
    edadObtencionCarnet: undefined,
  };

  conductoresOcasionales = signal<Persona[]>([]);

  formErrors = signal<string[]>([]);

  constructor(
    private bdi: BdiService,
    private sisnet: SisnetService
  ) {
    this.documentos$ = this.bdi.getDocumentTypes().pipe(catchError(() => of([])));
    this.paises$ = this.bdi.getCountries().pipe(catchError(() => of([])));
    this.tiposCarnet$ = this.sisnet.getDrivingLicenseTypes().pipe(catchError(() => of([])));
    this.maxConductoresOcasionales = toSignal(
      this.sisnet.getNumberOfOccasionalDrivers().pipe(catchError(() => of(0))),
      { initialValue: 0 }
    );
  }

  ngOnInit(): void {
    this.initFromPage1IfNeeded();
    this.enforceAllCIFRules();
  }

  /* ----------------- Inicialización desde página 1 (si aplica) ----------------- */

  private initFromPage1IfNeeded(): void {
    // Si tienes un servicio compartido con datos de la página 1, prellenar tomador y/o dirección.
    // Ejemplo (descomentar y adaptar):
    // const page1 = this.miServicioCompartido.getPage1Data();
    // if (page1?.tomador) { this.tomador = { ...this.tomador, ...page1.tomador }; }
    // if (page1?.direccion) { this.propietarioDireccion = page1.direccion; }
  }

  /* ----------------- Reglas y validaciones específicas (CIF, campos ocultos) ----------------- */

  /**
   * Cuando cambia el tipo de documento en un registro, aplicar reglas:
   * - Si es CIF: ocultar fechas y tipo de carnet (se limpian).
   * - Si no es CIF: mantener/permitir campos de fecha y carnet.
   */
  onDocumentoChange(model: Persona, newDocumento: string): void {
    model.documento = newDocumento;
    if (newDocumento === 'CIF') {
      // limpiar campos no aplicables
      model.fechaNacimiento = null;
      model.fechaObtencionCarnet = null;
      model.tipoCarnet = undefined;
      model.edadObtencionCarnet = undefined;
    }
    // Reaplicar reglas globales sobre CIF y roles
    this.enforceAllCIFRules();
  }

  /**
   * Reglas globales:
   * - Un CIF no debe tener campos de carnet/fechas.
   * - Un CIF solo puede ser tomador o propietario. Si detectamos conflicto (p. ej. conductor habitual con CIF),
   *   corregimos el documento del conductor a 'NIF' y dejamos un warning en consola (o mostrar mensaje UI).
   */
  private enforceAllCIFRules(): void {
    // Asegurar que si tomador es CIF, conductor habitual no sea CIF
    if (this.tomador.documento === 'CIF' && this.conductorHabitual.documento === 'CIF') {
      // corregir conductor habitual a NIF por defecto
      console.warn('Conductor habitual no puede ser CIF cuando tomador es CIF. Se cambia a NIF.');
      this.conductorHabitual.documento = 'NIF';
    }

    // Si propietario es CIF y conductorHabitual es CIF, evitar conflicto:
    if (this.propietario.documento === 'CIF' && this.conductorHabitual.documento === 'CIF') {
      console.warn('Conductor habitual no puede ser CIF cuando propietario es CIF. Se cambia a NIF.');
      this.conductorHabitual.documento = 'NIF';
    }

    // Si algún conductor ocasional es CIF, permitirlo solo si no rompe la regla:
    this.conductoresOcasionales().forEach((oc: Persona, idx: number) => {
      if (oc.documento === 'CIF') {
        // Si ya existe un CIF en tomador o propietario y la regla de negocio es "un CIF solo puede ser tomador o propietario",
        // entonces forzamos a NIF en el ocasional.
        if (this.tomador.documento === 'CIF' || this.propietario.documento === 'CIF') {
          console.warn(`Conductor ocasional ${idx} no puede ser CIF cuando ya hay un CIF en tomador/propietario. Se cambia a NIF.`);
          oc.documento = 'NIF';
        }
      }
      // además limpiar campos no aplicables si es CIF
      if (oc.documento === 'CIF') {
        oc.fechaNacimiento = null;
        oc.fechaObtencionCarnet = null;
        oc.tipoCarnet = undefined;
        oc.edadObtencionCarnet = undefined;
      }
    });

    // Limpiar campos de tomador/propietario/conductorHabitual si son CIF
    [this.tomador, this.propietario, this.conductorHabitual].forEach(p => {
      if (p.documento === 'CIF') {
        p.fechaNacimiento = null;
        p.fechaObtencionCarnet = null;
        p.tipoCarnet = undefined;
        p.edadObtencionCarnet = undefined;
      }
    });
  }

  /* ----------------- Toggle / Dirección propietario ----------------- */

  /**
   * Handler para el toggle "Tomador es propietario".
   * Si se desmarca, abrimos la sección para introducir la dirección del propietario.
   * Usa este método en la plantilla en el (change) del checkbox.
   */
  onTomadorEsPropietarioChange(checked: boolean): void {
    this.tomadorEsPropietario.set(checked);
    if (!checked) {
      this.openDireccionPropietario();
    } else {
      // Si vuelve a marcar que sí es propietario, ocultamos la sección (pero mantenemos la dirección guardada)
      this.closeDireccionPropietario();
    }
  }

  openDireccionPropietario(): void {
    this.showDireccionPropietario.set(true);
    // Si existe dirección en la página 1 y quieres prellenar:
    // this.propietarioDireccion.set(this.getDireccionFromPage1() ?? this.propietarioDireccion());
  }

  closeDireccionPropietario(): void {
    this.showDireccionPropietario.set(false);
  }

  /**
   * Normaliza el payload emitido por DireccionTomadorComponent en (save).
   * Acepta tanto { domicilio } como CustomEvent y guarda el domicilio en propietarioDireccion.
   * Tras guardar, cerramos la sección (comportamiento configurable).
   */
  onDireccionGuardada(payload: any): void {
    const detail = payload?.detail ?? payload;
    const domicilio = detail?.domicilio ?? detail;
    if (domicilio && typeof domicilio === 'string') {
      this.propietarioDireccion.set({ domicilio });
      this.closeDireccionPropietario();
    }
  }

  /* ----------------- Conductores ocasionales (lógica y límites) ----------------- */

  addConductorOcasional(): void {
    if (this.maxConductoresOcasionales() && this.conductoresOcasionales().length >= this.maxConductoresOcasionales()) {
      console.warn('Se alcanzó el número máximo de conductores ocasionales permitido por Sisnet.');
      return;
    }
    this.conductoresOcasionales.mutate((list: Persona[]) => {
      list.push({
        documento: 'NIF',
        numeroDocumento: '',
        pais: 'ES',
        fechaNacimiento: null,
        tipoCarnet: 'B',
        fechaObtencionCarnet: null,
        edadObtencionCarnet: undefined,
      });
    });
  }

  removeConductorOcasional(index: number): void {
    this.conductoresOcasionales.mutate((list: Persona[]) => {
      if (index >= 0 && index < list.length) {
        list.splice(index, 1);
      }
    });
  }

  /* ----------------- Handlers para inputs Baloise (normalización de eventos) ----------------- */

  onSelectChange(event: any, model: any, field: string): void {
    const v = event?.detail ?? event?.detail?.value ?? event?.target?.value ?? event;
    model[field] = typeof v === 'object' && 'value' in v ? v.value : v;
    // Si cambiamos documento, aplicar reglas
    if (field === 'documento') {
      this.onDocumentoChange(model, model[field]);
    }
  }

  onInputChange(event: any, model: any, field: string): void {
    const v = event?.detail ?? event?.detail?.value ?? event?.target?.value ?? event;
    model[field] = typeof v === 'object' && 'value' in v ? v.value : v;
  }

  onDateChange(event: any, model: any, field: string): void {
    const iso = event?.detail ?? event?.detail?.value ?? event?.target?.value ?? null;
    model[field] = iso ? this.isoToDate(String(iso)) : null;
  }

  /* ----------------- Utilidades de fecha ----------------- */

  dateToIso(d?: Date | null): string | undefined {
    if (!d) return undefined;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  isoToDate(iso?: string | null): Date | null {
    if (!iso) return null;
    const parts = String(iso).split('T')[0].split('-');
    if (parts.length >= 3) {
      const y = Number(parts[0]);
      const m = Number(parts[1]) - 1;
      const d = Number(parts[2]);
      return new Date(y, m, d);
    }
    return new Date(iso);
  }

  /* ----------------- Validación final antes de enviar / siguiente paso ----------------- */

  validateBeforeNext(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Ejemplo: si tomadorEsPropietario === false, debe existir propietarioDireccion
    if (!this.tomadorEsPropietario() && !this.propietarioDireccion()) {
      errors.push('Debe introducir la dirección del propietario si el tomador no es propietario.');
    }

    // Validaciones por persona: documento y número
    const persons: { name: string; p: Persona }[] = [
      { name: 'Tomador', p: this.tomador },
      { name: 'Propietario', p: this.propietario },
      { name: 'Conductor habitual', p: this.conductorHabitual },
      // conductores ocasionales se validan por separado
    ];

    persons.forEach(item => {
      if (!item.p.numeroDocumento || String(item.p.numeroDocumento).trim().length < 3) {
        errors.push(`${item.name}: número de documento inválido.`);
      }
      if (!item.p.pais) {
        errors.push(`${item.name}: país no seleccionado.`);
      }
      if (item.p.documento === 'CIF') {
        // CIF no debe tener fechas ni carnet
        if (item.p.tipoCarnet) {
          errors.push(`${item.name}: CIF no debe tener tipo de carnet.`);
        }
      } else {
        // si no es CIF, comprobar que si hay carnet, la fecha de obtención exista
        if (item.p.tipoCarnet && !item.p.fechaObtencionCarnet && !item.p.edadObtencionCarnet) {
          errors.push(`${item.name}: falta fecha o edad de obtención del carnet.`);
        }
      }
    });

    // conductores ocasionales
    this.conductoresOcasionales().forEach((oc: Persona, idx: number) => {
      if (!oc.numeroDocumento || String(oc.numeroDocumento).trim().length < 3) {
        errors.push(`Conductor ocasional ${idx + 1}: número de documento inválido.`);
      }
      if (oc.documento === 'CIF') {
        errors.push(`Conductor ocasional ${idx + 1}: no puede ser CIF.`);
      }
    });

    this.formErrors.set(errors);
    return { valid: errors.length === 0, errors };
  }

  // Utility used in template to hide/show carnet/date fields
  esCIF(model: Persona | any): boolean {
    return model?.documento === 'CIF';
  }

  /**
   * Generic handler for radio groups (if you keep bal-radio-group)
   * event may be CustomEvent or native event; normalize it.
   */
  onRadioChange(event: any, target: 'propietario' | 'conductor'): void {
    const detail = event?.detail ?? event;
    const value = detail?.value ?? detail;
    const checked = value === 'true' || value === true;
    if (target === 'propietario') {
      this.tomadorEsPropietario.set(checked);
      // keep existing logic: open direccion if false
      if (!checked) this.openDireccionPropietario();
    } else {
      this.tomadorEsConductorHabitual.set(checked);
    }
  }

  onTomadorEsConductorHabitualChange(checked: boolean): void {
    this.tomadorEsConductorHabitual.set(checked);
  }
}
