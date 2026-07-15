import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  EventEmitter,
  inject,
  OnInit,
  Output,
  Signal,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

import {
  BalIcon,
  BalSelect,
  BalSelectOption,
  BalDate,
  BalInput,
  BalButton,
  BalHeading,
  BalField,
  BalFieldLabel,
  BalFieldControl,
  BalCheckbox,
  BalCard,
} from '@baloise/ds-angular';
import { TranslateModule } from '@ngx-translate/core';

import { BdiService } from '../../services/bdi.service';
import { SisnetService } from '../../services/sisnet.service';

import { Persona } from '../../models/persona.model';
import { DireccionModel } from '../../models/direccion.model';
import { UsoConductoresStateService } from '../../uso-conductores-state.service';
import { USO_CONDUCTORES_STEPS } from '../../uso-conductores.steps';

@Component({
  selector: 'app-intervinientes',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,
    BalIcon,
    BalSelect,
    BalSelectOption,
    BalDate,
    BalInput,
    BalButton,
    TranslateModule,
    BalHeading,
    BalField,
    BalFieldLabel,
    BalFieldControl,
    BalCheckbox,
    BalCard,
  ],
  templateUrl: './intervinientes.html',
  host: { class: 'intervinientes-host' },
})
export class IntervinientesComponent implements OnInit {
  @Output() intervinientesCompleted = new EventEmitter<void>();
@Output() stepSelected = new EventEmitter<string>();
  tomadorEsPropietario = signal(true);
  tomadorEsConductorHabitual = signal(true);

  documentos$!: Observable<{ label: string; value: string }[]>;
  paises$!: Observable<{ label: string; value: string }[]>;
  tiposCarnet$!: Observable<{ label: string; value: string }[]>;

  maxConductoresOcasionales!: Signal<number>;

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

  propietarioDireccion: DireccionModel | null = null;

  public usoState = inject(UsoConductoresStateService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly NIE_MAP = { X: '0', Y: '1', Z: '2' } as const;

  constructor(private bdi: BdiService, private sisnet: SisnetService) {
    this.documentos$ = this.bdi.getDocumentTypes().pipe(catchError(() => of([])));
    this.paises$ = this.bdi.getCountries().pipe(catchError(() => of([])));
    this.tiposCarnet$ = this.sisnet.getDrivingLicenseTypes().pipe(catchError(() => of([])));

    this.maxConductoresOcasionales = toSignal(
      this.sisnet.getNumberOfOccasionalDrivers().pipe(catchError(() => of(0))),
      { initialValue: 0 }
    );
  }

  ngOnInit(): void {
      this.stepSelected.emit('intervinientes');
      const saved = this.usoState.intervinientes();
    if (saved) {
      this.tomadorEsPropietario.set(saved.tomadorEsPropietario);
      this.tomadorEsConductorHabitual.set(saved.tomadorEsConductorHabitual);
      this.tomador = this.restorePersona(saved.tomador);
      this.propietario = this.restorePersona(saved.propietario);
      this.conductorHabitual = this.restorePersona(saved.conductorHabitual);
      this.conductoresOcasionales.set((saved.conductoresOcasionales ?? []).map(item => this.restorePersona(item)));
      this.propietarioDireccion = saved.propietarioDireccion;
    }

    this.enforceAllCIFRules();
    this.autofillRelatedPersons();
    this.checkCompletion();
  }

  private isEmptyPersonaModel(model: Persona | null | undefined): boolean {
    if (!model) return true;
    return !model.numeroDocumento || String(model.numeroDocumento).trim().length === 0;
  }

  private copyFromTomador(target: Persona): void {
    target.numeroDocumento = this.tomador.numeroDocumento ?? '';
    target.pais = this.tomador.pais ?? 'ES';
    target.fechaNacimiento = this.tomador.fechaNacimiento ? new Date(this.tomador.fechaNacimiento) : null;
    if (!target.tipoCarnet) target.tipoCarnet = 'B';
    if (!target.fechaObtencionCarnet) target.fechaObtencionCarnet = this.tomador.fechaObtencionCarnet ? new Date(this.tomador.fechaObtencionCarnet) : null;
  }

  private autofillRelatedPersons(): void {
    // If propietario is a separate section and empty, prefill with tomador values
    if (!this.tomadorEsPropietario() && this.isEmptyPersonaModel(this.propietario)) {
      this.copyFromTomador(this.propietario as Persona);
    }

    // If conductor habitual is a separate section and empty, prefill with tomador values
    if (!this.tomadorEsConductorHabitual() && this.isEmptyPersonaModel(this.conductorHabitual)) {
      this.copyFromTomador(this.conductorHabitual as Persona);
    }

    // Prefill occasional drivers if none exist (do not overwrite existing ones)
    if (this.conductoresOcasionales().length === 0 && this.isEmptyPersonaModel(undefined)) {
      // no-op: only prefill on add
    }
  }

  useEdadTomador(): boolean {
    return this.tomadorEsPropietario() && !this.tomadorEsConductorHabitual();
  }

  useEdadConductorHabitual(): boolean {
    return this.tomadorEsPropietario();
  }

  private enforceAllCIFRules(): void {
    if (this.tomador.documento === 'CIF' && this.conductorHabitual.documento === 'CIF') {
      this.conductorHabitual.documento = 'NIF';
    }

    if (this.propietario.documento === 'CIF' && this.conductorHabitual.documento === 'CIF') {
      this.conductorHabitual.documento = 'NIF';
    }

    this.conductoresOcasionales().forEach((oc: Persona) => {
      if (oc.documento === 'CIF') {
        oc.fechaNacimiento = null;
        oc.fechaObtencionCarnet = null;
        oc.tipoCarnet = undefined;
        oc.edadObtencionCarnet = undefined;
      }
    });

    [this.tomador, this.propietario, this.conductorHabitual].forEach(persona => {
      if (persona.documento === 'CIF') {
        persona.fechaNacimiento = null;
        persona.fechaObtencionCarnet = null;
        persona.tipoCarnet = undefined;
        persona.edadObtencionCarnet = undefined;
      }
    });
  }

  private restorePersona(data: any): Persona {
    return {
      documento: data?.documento ?? 'NIF',
      numeroDocumento: data?.numeroDocumento ?? '',
      pais: data?.pais ?? 'ES',
      fechaNacimiento: this.isoToDate(data?.fechaNacimiento),
      tipoCarnet: data?.tipoCarnet ?? 'B',
      fechaObtencionCarnet: this.isoToDate(data?.fechaObtencionCarnet),
      edadObtencionCarnet: data?.edadObtencionCarnet,
    };
  }

  private serializePersona(person: Persona): any {
    return {
      ...person,
      fechaNacimiento: this.dateToIso(person.fechaNacimiento),
      fechaObtencionCarnet: this.dateToIso(person.fechaObtencionCarnet),
    };
  }

  private persistIntervinientesState(): void {
    this.usoState.updateIntervinientesState({
      tomadorEsPropietario: this.tomadorEsPropietario(),
      tomadorEsConductorHabitual: this.tomadorEsConductorHabitual(),
      tomador: this.serializePersona(this.tomador),
      propietario: this.serializePersona(this.propietario),
      conductorHabitual: this.serializePersona(this.conductorHabitual),
      conductoresOcasionales: this.conductoresOcasionales().map(item => this.serializePersona(item)),
      propietarioDireccion: this.propietarioDireccion ? { ...this.propietarioDireccion } : null,
    });
  }

  private getCheckedFromEvent(event: any): boolean {
    if (event === null || event === undefined) {
      return false;
    }

    if (typeof event === 'boolean') {
      return event;
    }

    if (event?.detail !== undefined) {
      const detail = event.detail;
      if (typeof detail === 'boolean') {
        return detail;
      }
      if (detail && typeof detail === 'object' && 'value' in detail) {
        return !!detail.value;
      }
      return !!detail;
    }

    if (event.target && typeof event.target.checked === 'boolean') {
      return event.target.checked;
    }

    return !!event;
  }

  /**
   * Toggle handlers
   * Accept either:
   *  - boolean (native input change -> $event.target.checked)
   *  - CustomEvent (bal-switch) where detail is boolean
   *  - Angular Event where target.checked exists
   */
  onTomadorEsPropietarioChange(event: any): void {
    const checked = this.getCheckedFromEvent(event);
    this.tomadorEsPropietario.set(checked);

    if (checked) {
    this.usoState.resetDireccionTomador();
    this.propietarioDireccion = null;

    const originalIndex = USO_CONDUCTORES_STEPS.findIndex(s => s.id === 'direccion-tomador');
    if (originalIndex >= 0) {
      this.usoState.clearStepLoaded(originalIndex);
    }

    // If the tomador is NOT propietario and propietario section is empty, prefill it from tomador
    if (!checked && this.isEmptyPersonaModel(this.propietario)) {
      this.copyFromTomador(this.propietario as Persona);
    }

    const segments = this.router.parseUrl(this.router.url)
      .root.children['primary']?.segments.map(s => s.path) ?? [];

    if (segments[1] === 'direccion-tomador') {
      void this.router.navigate(['/uso-conductores', 'intervinientes'], { replaceUrl: true });
    }
  }

  this.persistIntervinientesState();
  this.checkCompletion();
  this.cdr.detectChanges();
}

onTomadorEsConductorHabitualChange(event: any): void {
  const checked = this.getCheckedFromEvent(event);
  this.tomadorEsConductorHabitual.set(checked);

  // If the conductor habitual section is shown (toggle turned off), autofill with tomador values when empty
  if (!checked && this.isEmptyPersonaModel(this.conductorHabitual)) {
    this.copyFromTomador(this.conductorHabitual as Persona);
  }

  this.persistIntervinientesState();
  this.checkCompletion();
  this.cdr.detectChanges();
}


  addConductorOcasional(): void {
    if (this.maxConductoresOcasionales() && this.conductoresOcasionales().length >= this.maxConductoresOcasionales()) {
      return;
    }

    const newOc: Persona = {
      documento: 'NIF',
      numeroDocumento: this.tomador.numeroDocumento ?? '',
      pais: this.tomador.pais ?? 'ES',
      fechaNacimiento: this.tomador.fechaNacimiento ? new Date(this.tomador.fechaNacimiento) : null,
      tipoCarnet: this.tomador.tipoCarnet ?? 'B',
      fechaObtencionCarnet: this.tomador.fechaObtencionCarnet ? new Date(this.tomador.fechaObtencionCarnet) : null,
      edadObtencionCarnet: this.tomador.edadObtencionCarnet,
    };

    this.conductoresOcasionales.update(list => [...list, newOc]);
    this.persistIntervinientesState();
    this.checkCompletion();
  }

  removeConductorOcasional(index: number): void {
    this.conductoresOcasionales.update(list => {
      const copy = [...list];
      if (index >= 0 && index < copy.length) {
        copy.splice(index, 1);
      }
      return copy;
    });
    this.persistIntervinientesState();
    this.checkCompletion();
  }

  onDocumentoChange(model: Persona, newDocumento: string): void {
    model.documento = newDocumento;
    model.numeroDocumento = '';

    if (newDocumento === 'CIF') {
      model.fechaNacimiento = null;
      model.fechaObtencionCarnet = null;
      model.tipoCarnet = undefined;
      model.edadObtencionCarnet = undefined;
    }

    this.enforceAllCIFRules();
    this.persistIntervinientesState();
    this.checkCompletion();
  }

  /**
   * Generic select handler: supports bal-select (CustomEvent.detail),
   * Angular event, or direct value.
   */
  onSelectChange(eventOrValue: any, model: any, field: string): void {
    const v =
      eventOrValue?.detail?.value ??
      eventOrValue?.detail ??
      eventOrValue?.target?.value ??
      eventOrValue;

    model[field] = typeof v === 'object' && 'value' in v ? v.value : v;

    if (field === 'documento') {
      this.onDocumentoChange(model as Persona, model[field]);
      return;
    }

    this.persistIntervinientesState();
    this.checkCompletion();
  }

  onDateChange(eventOrValue: any, model: any, field: string): void {
    const iso =
      eventOrValue?.detail?.value ?? eventOrValue?.detail ?? eventOrValue?.target?.value ?? eventOrValue;
    model[field] = iso ? this.isoToDate(String(iso)) : null;
    this.persistIntervinientesState();
    this.checkCompletion();
  }

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

  esCIF(model: Persona | any): boolean {
    return model?.documento === 'CIF';
  }

  onPropietarioDireccionSave(model: DireccionModel): void {
    this.propietarioDireccion = model;
    this.persistIntervinientesState();
    this.checkCompletion();
  }

  onPropietarioDireccionCompleted(): void {
    this.persistIntervinientesState();
    this.checkCompletion();
  }

  private isPersonaComplete(model: Persona, opts: { showCarnet: boolean; useEdad: boolean; requireCarnet?: boolean }): boolean {
    if (!model.documento) return false;
    if (!model.numeroDocumento || model.numeroDocumento.trim().length === 0) return false;
    if (!model.pais) return false;

    if (model.documento === 'NIF' || model.documento === 'NIE') {
      if (!this.isDocumentoValid(model.numeroDocumento)) return false;
    }

    if (model.documento === 'PASAPORTE') {
      if (!/^[A-Z0-9]{3,}$/.test(String(model.numeroDocumento).toUpperCase())) return false;
    }

    if (model.documento === 'CIF') {
      if (!/^[A-HJ-NP-SUVW][0-9]{7}[0-9A-J]$/i.test(String(model.numeroDocumento))) return false;
      return true;
    }

    if (!model.fechaNacimiento) return false;

    const requireCarnet = opts.requireCarnet === undefined ? true : !!opts.requireCarnet;
    if (opts.showCarnet && requireCarnet) {
      if (!model.tipoCarnet) return false;

      if (opts.useEdad) {
        if (!model.edadObtencionCarnet) return false;
      } else {
        if (!model.fechaObtencionCarnet) return false;
      }
    }

    return true;
  }

  private checkCompletion(): void {
    const tomadorUseEdad = this.tomadorEsPropietario() && !this.tomadorEsConductorHabitual();
    const tomadorOk = this.isPersonaComplete(this.tomador, { showCarnet: true, useEdad: tomadorUseEdad });

    let propietarioOk = true;
    if (!this.tomadorEsPropietario()) {
      // propietario shown separately: show carnet fields but they are not mandatory per spec
      propietarioOk = this.isPersonaComplete(this.propietario, { showCarnet: true, useEdad: false, requireCarnet: false });
    }

    let conductorOk = true;
    if (!this.tomadorEsConductorHabitual()) {
      const conductorUseEdad = this.tomadorEsPropietario();
      // conductor habitual shown separately: carnet fields shown and required (useEdad controls fecha/edad requirement)
      conductorOk = this.isPersonaComplete(this.conductorHabitual, { showCarnet: true, useEdad: conductorUseEdad, requireCarnet: true });
    }

    const ocasionales = this.conductoresOcasionales();
    let ocasionalesOk = true;
    for (const oc of ocasionales) {
      if (!this.isPersonaComplete(oc, { showCarnet: true, useEdad: false })) {
        ocasionalesOk = false;
        break;
      }
    }

    this.persistIntervinientesState();

    const allComplete = tomadorOk && propietarioOk && conductorOk && ocasionalesOk;

    if (allComplete) {
      this.usoState.setStepLoaded(1);
      this.usoState.completeIntervinientes();
    } else {
      this.usoState.resetIntervinientes();
    }
  }

  private readInputValue(event: any): string {
    const raw = event?.detail?.value ?? event?.target?.value ?? event ?? '';
    return String(raw ?? '').trim().toUpperCase();
  }

  onInputChange(event: any, model: any, field: string): void {
    const value = this.readInputValue(event);
    model[field] = value;
    this.persistIntervinientesState();
    this.checkCompletion();
  }

  onNumeroDocumentoBlur(model: any): void {
    if (!model) return;

    let value = String(model.numeroDocumento ?? '')
      .toUpperCase()
      .replace(/[^A-Z0-9ÑXYZ]/g, '');
    value = value.replace(/^X/, 'X').replace(/^Y/, 'Y').replace(/^Z/, 'Z');

    model.numeroDocumento = value;
    this.persistIntervinientesState();
    this.checkCompletion();
  }

  isDocumentoValid(value: string): boolean {
    if (!value) return false;
    const v = String(value).toUpperCase().trim();

    const nifRegex = /^[0-9]{8}[A-Z]$/;
    const nieRegex = /^[XYZ][0-9]{7}[A-Z]$/;
    const cifRegex = /^[A-HJ-NP-SUVW][0-9]{7}[0-9A-J]$/i;
    const passportRegex = /^[A-Z0-9]{3,}$/;

    if (nifRegex.test(v)) return this.validateNifControl(v);
    if (nieRegex.test(v)) return this.validateNieControl(v);
    if (cifRegex.test(v)) return true;
    if (passportRegex.test(v)) return true;

    return false;
  }

  validateNifControl(nif: string): boolean {
    if (!nif || nif.length !== 9) return false;
    const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
    const number = parseInt(nif.slice(0, 8), 10);
    if (Number.isNaN(number)) return false;
    const expected = letters[number % 23];
    return nif[8] === expected;
  }

  validateNieControl(nie: string): boolean {
    if (!nie || nie.length !== 9) return false;

    const first = String(nie[0]).toUpperCase();
    const rest = nie.slice(1);

    if (!(first in this.NIE_MAP)) {
      return false;
    }

    const mapped = this.NIE_MAP[first as keyof typeof this.NIE_MAP];
    const numericPart = mapped + rest.slice(0, 7);
    const checkLetter = rest[7];
    const nifLike = numericPart + checkLetter;

    return this.validateNifControl(nifLike);
  }

  numeroDocumentoError(model: Persona): string | null {
    if (!model.numeroDocumento || model.numeroDocumento.trim().length === 0) return 'Campo obligatorio';
    if ((model.documento === 'NIF' || model.documento === 'NIE') && !this.isDocumentoValid(model.numeroDocumento))
      return 'Formato inválido';
    if (model.documento === 'CIF' && !/^[A-HJ-NP-SUVW][0-9]{7}[0-9A-J]$/i.test(String(model.numeroDocumento)))
      return 'Formato CIF inválido';
    return null;
  }
}
