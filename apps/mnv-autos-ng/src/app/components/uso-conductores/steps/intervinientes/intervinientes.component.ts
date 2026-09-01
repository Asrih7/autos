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
import { catchError, map } from 'rxjs/operators';
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
import { validateDocumentNumber } from '@mnv-autos-ng/ui';

import { Persona } from '../../models/persona.model';
import { DireccionModel } from '../../models/direccion.model';
import { UsoConductoresStateService } from '../../uso-conductores-state.service';
import { TuClienteStateService } from '../../../tu-cliente/tu-cliente-state.service';
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
  templateUrl: './intervinientes.component.html',
  host: { class: 'intervinientes-host' },
})
export class IntervinientesComponent implements OnInit {
  @Output() intervinientesCompleted = new EventEmitter<void>();
  @Output() stepSelected = new EventEmitter<string>();
  tomadorEsPropietario = signal(true);
  tomadorEsConductorHabitual = signal(true);

  documentos$!: Observable<{ label: string; value: string }[]>;
  documentosSinCif$!: Observable<{ label: string; value: string }[]>;
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
  private readonly tuClienteState = inject(TuClienteStateService);

  private readonly NIE_MAP = { X: '0', Y: '1', Z: '2' } as const;
  private readonly CIF_LETTER_ONLY = ['K', 'P', 'Q', 'S'];
  private readonly CIF_NUMBER_ONLY = ['A', 'B', 'E', 'H'];
  private readonly CIF_CONTROL_LETTERS = 'JABCDEFGHI'; // index 0..9 maps D=0..9

  private readonly touched = new WeakMap<Persona, Set<string>>();

  private markTouched(model: Persona, field: string): void {
    if (!model) return;
    let set = this.touched.get(model);
    if (!set) {
      set = new Set<string>();
      this.touched.set(model, set);
    }
    set.add(field);
  }

  private isTouched(model: Persona, field: string): boolean {
    if (!model) return false;
    const set = this.touched.get(model);
    return !!set && set.has(field);
  }

  constructor(private bdi: BdiService, private sisnet: SisnetService) {
    this.documentos$ = this.bdi.getDocumentTypes().pipe(catchError(() => of([])));
    this.documentosSinCif$ = this.documentos$.pipe(
      map(docs => docs.filter(d => d.value !== 'CIF'))
    );
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

    const tomadorYaInformado = Boolean(
      saved?.tomador?.numeroDocumento?.trim(),
    );

    // La página de clientes completa el tomador solo al iniciar el flujo.
    // Al volver desde otra pantalla se conserva lo que el mediador haya
    // introducido manualmente y lo que ya estaba guardado en el state.
    if (!tomadorYaInformado) {
      this.applyTomadorDataFromClient();
    }

    this.enforceAllCIFRules();
    // Solo se precargan propietario y conductor habitual si están vacíos.
    // Así no se destruyen datos manuales al reconstruir el componente.
    this.initializeRelatedPersonsWithoutOverwritingSavedData();
    this.persistIntervinientesState();
    this.checkCompletion();
  }

  private isEmptyPersonaModel(model: Persona | null | undefined): boolean {
    if (!model) return true;
    return !model.numeroDocumento || String(model.numeroDocumento).trim().length === 0;
  }

  private copyFromTomador(target: Persona): void {
    target.documento = this.tomador.documento ?? '';
    target.numeroDocumento = this.tomador.numeroDocumento ?? '';
    target.pais = this.tomador.pais ?? '';
    target.fechaNacimiento = this.tomador.fechaNacimiento
      ? new Date(this.tomador.fechaNacimiento)
      : null;
  }

  private emptyPersona(): Persona {
    return {
      documento: '',
      numeroDocumento: '',
      pais: '',
      fechaNacimiento: null,
      tipoCarnet: undefined,
      fechaObtencionCarnet: null,
      edadObtencionCarnet: undefined,
    };
  }

  private clearPersona(model: Persona): void {
    Object.assign(model, this.emptyPersona());
  }

  private applyTomadorDataFromClient(): void {
    const client = this.tuClienteState.datosPersona();
    if (!client?.documentNumber?.trim()) return;

    const documentTypeMap: Record<string, string> = {
      nif: 'NIF',
      nie: 'NIE',
      passport: 'PAS',
      nrt: 'NRT',
      cif: 'CIF',
    };

    // La página de cliente es la fuente de verdad del tomador. Se sincroniza
    // siempre al entrar en este paso para no reutilizar valores de una sesión
    // anterior cuando el cliente actual ha cambiado.
    this.tomador.documento =
      documentTypeMap[String(client.documentType ?? '').toLowerCase()] ?? 'NIF';
    this.tomador.numeroDocumento = client.documentNumber.trim();
    const nationality = String(client.nationality ?? '').trim();
    this.tomador.pais = ['española', 'españa', 'espana', 'es'].includes(nationality.toLowerCase())
      ? 'ES'
      : nationality;
    this.tomador.fechaNacimiento = this.tuClienteState.birthDate()
      ? this.isoToDate(this.tuClienteState.birthDate())
      : null;
  }

  private autofillRelatedPersons(): void {
    if (this.tomadorEsPropietario()) {
      this.copyFromTomador(this.propietario);
    } else {
      this.clearPersona(this.propietario);
    }

    if (this.tomadorEsConductorHabitual()) {
      this.copyFromTomador(this.conductorHabitual);
    } else {
      this.clearPersona(this.conductorHabitual);
    }
  }

  /**
   * Inicializa las relaciones por defecto sin destruir una sesión restaurada.
   * Al volver desde otra pantalla, propietario, conductor habitual y ocasionales
   * ya contienen los datos introducidos por el mediador y deben conservarse.
   */
  private initializeRelatedPersonsWithoutOverwritingSavedData(): void {
    if (this.tomadorEsPropietario() && this.isEmptyPersonaModel(this.propietario)) {
      this.copyFromTomador(this.propietario);
    }

    if (this.tomadorEsConductorHabitual() && this.isEmptyPersonaModel(this.conductorHabitual)) {
      this.copyFromTomador(this.conductorHabitual);
    }
  }

  useEdadTomador(): boolean {
    return this.tomadorEsPropietario() && !this.tomadorEsConductorHabitual();
  }

  useEdadConductorHabitual(): boolean {
    return this.tomadorEsPropietario();
  }

  private enforceAllCIFRules(): void {
    // Los conductores NO pueden ser CIF
    if (this.conductorHabitual.documento === 'CIF') {
      this.conductorHabitual.documento = 'NIF';
    }

    // Si tomador=conductor tampoco podría ser CIF
    if (this.tomadorEsConductorHabitual() && this.tomador.documento === 'CIF') {
      this.tomador.documento = 'NIF';
    }

    this.conductoresOcasionales().forEach((oc: Persona) => {
      if (oc.documento === 'CIF') {
        oc.documento = 'NIF';
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
      // Conservar exactamente lo guardado, incluidos los campos vacíos.
      documento: data?.documento ?? '',
      numeroDocumento: data?.numeroDocumento ?? '',
      pais: data?.pais ?? '',
      fechaNacimiento: this.isoToDate(data?.fechaNacimiento),
      tipoCarnet: data?.tipoCarnet ?? undefined,
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

  onTomadorEsPropietarioChange(event: any): void {
    const checked = this.getCheckedFromEvent(event);
    this.tomadorEsPropietario.set(checked);

    if (checked) {
      // El paso "Dirección tomador" deja de mostrarse: hay que borrar toda
      // la dirección guardada (no solo el flag "completed"), si no la
      // siguiente vez que se re-active el toggle el botón "Continuar" del
      // footer se queda bloqueado intentando renormalizar una dirección
      // antigua que ya no corresponde a ningún formulario visible.
      this.usoState.clearDireccionTomador();
      this.propietarioDireccion = null;

      const originalIndex = USO_CONDUCTORES_STEPS.findIndex(s => s.id === 'direccion-tomador');
      if (originalIndex >= 0) {
        this.usoState.clearStepLoaded(originalIndex);
      }

      this.autofillRelatedPersons();

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

    this.autofillRelatedPersons();

    this.persistIntervinientesState();
    this.checkCompletion();
    this.cdr.detectChanges();
  }

  addConductorOcasional(): void {
    if (this.maxConductoresOcasionales() && this.conductoresOcasionales().length >= this.maxConductoresOcasionales()) {
      return;
    }

    // Un conductor ocasional siempre comienza como una persona nueva y no
    // comparte referencia ni datos con la tarjeta del tomador.
    const newOc: Persona = this.emptyPersona();

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

    this.markTouched(model as Persona, field);

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

    if (!this.isDocumentoValid(model.numeroDocumento, model.documento)) {
      return false;
    }

    if (model.documento !== 'CIF' && !model.fechaNacimiento) return false;

    const requireCarnet = opts.requireCarnet === undefined ? true : !!opts.requireCarnet;
    if (opts.showCarnet && requireCarnet) {
      if (!model.tipoCarnet) return false;

      if (opts.useEdad) {
        if (!model.edadObtencionCarnet) return false;
        if (!this.isEdadObtencionCarnetValid(model.edadObtencionCarnet)) return false;
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
      propietarioOk = this.isPersonaComplete(this.propietario, { showCarnet: true, useEdad: false, requireCarnet: false });
    }

    let conductorOk = true;
    if (!this.tomadorEsConductorHabitual()) {
      const conductorUseEdad = this.tomadorEsPropietario();
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

  isDocumentoValid(value: string, documento: string): boolean {
    if (!value) return false;

    const typeMap: Record<string, any> = {
      'NIF': 'nif',
      'NIE': 'nie',
      'CIF': 'cif',
      'PASAPORTE': 'passport'
    };

    const type = typeMap[documento] || documento.toLowerCase();
    return validateDocumentNumber(type, value) === null;
  }

  numeroDocumentoError(model: Persona): string | null {
    if (!model.numeroDocumento || model.numeroDocumento.trim().length === 0) return 'Campo obligatorio';

    const typeMap: Record<string, any> = {
      'NIF': 'nif',
      'NIE': 'nie',
      'CIF': 'cif',
      'PASAPORTE': 'passport'
    };
    const type = typeMap[model.documento] || model.documento?.toLowerCase();
    const error = validateDocumentNumber(type, model.numeroDocumento);

    if (error) {
      const messages: Record<string, string> = {
        documentTypeRequired: 'Tipo de documento requerido',
        required: 'Campo obligatorio',
        invalidDni: 'DNI inválido',
        invalidNif: 'NIF inválido',
        invalidCif: 'CIF inválido',
        invalidNie: 'NIE inválido',
        invalidNrt: 'NRT inválido',
        invalidPassport: 'Pasaporte inválido',
      };
      return messages[error] || 'Formato inválido';
    }
    return null;
  }

  private personaStarted(model: Persona): boolean {
    return !this.isEmptyPersonaModel(model);
  }

  isEdadObtencionCarnetValid(value: string | number | undefined | null): boolean {
    if (value === undefined || value === null || String(value).trim() === '') return false;
    return /^[0-9]{2}$/.test(String(value).trim());
  }

  documentoError(model: Persona): string | null {
    if (this.personaStarted(model) && !model.documento) return 'Campo obligatorio';
    return null;
  }

  paisError(model: Persona): string | null {
    if (this.personaStarted(model) && !model.pais) return 'Campo obligatorio';
    return null;
  }

  fechaNacimientoError(model: Persona): string | null {
    if (this.esCIF(model)) return null;
    if (this.personaStarted(model) && !model.fechaNacimiento && this.isTouched(model, 'fechaNacimiento')) {
      return 'Campo obligatorio';
    }
    return null;
  }

  tipoCarnetError(model: Persona, showCarnet: boolean, requireCarnet: boolean): string | null {
    if (this.esCIF(model)) return null;
    if (!showCarnet || !requireCarnet) return null;
    if (this.personaStarted(model) && !model.tipoCarnet) return 'Campo obligatorio';
    return null;
  }

  fechaObtencionCarnetError(model: Persona, showCarnet: boolean, requireCarnet: boolean, useEdad: boolean): string | null {
    if (this.esCIF(model)) return null;
    if (!showCarnet || !requireCarnet || useEdad) return null;
    if (this.personaStarted(model) && !model.fechaObtencionCarnet && this.isTouched(model, 'fechaObtencionCarnet')) {
      return 'Campo obligatorio';
    }
    return null;
  }

  edadObtencionCarnetError(model: Persona, showCarnet: boolean, requireCarnet: boolean, useEdad: boolean): string | null {
    if (this.esCIF(model)) return null;
    if (!showCarnet || !requireCarnet || !useEdad) return null;

    const value = model.edadObtencionCarnet;
    const hasValue = value !== undefined && value !== null && String(value).trim() !== '';

    if (!hasValue) {
      return this.personaStarted(model) ? 'Campo obligatorio' : null;
    }
    if (!this.isEdadObtencionCarnetValid(value)) {
      return 'Debe tener 2 dígitos';
    }
    return null;
  }
}
