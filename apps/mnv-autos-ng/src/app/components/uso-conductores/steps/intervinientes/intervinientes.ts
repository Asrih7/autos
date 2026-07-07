import { Component, EventEmitter, OnInit, Output, Signal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  BalButton
} from '@baloise/ds-angular';
import { TranslateModule } from '@ngx-translate/core';

import { BdiService } from '../../services/bdi.service';
import { SisnetService } from '../../services/sisnet.service';

import { Persona } from '../../models/persona.model';
import { DireccionTomadorComponent } from './components/direccion-tomador/direccion-tomador.component';
import { DireccionModel } from '../../models/direccion.model';
import { UsoConductoresStateService } from '../../uso-conductores-state.service';

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
    DireccionTomadorComponent,
    TranslateModule
  ],
  templateUrl: './intervinientes.html',
  styleUrls: ['./intervinientes.scss'],
  host: { class: 'intervinientes-host' },
})
export class IntervinientesComponent implements OnInit {
  @Output() intervinientesCompleted = new EventEmitter<void>();

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

  // NIE map typed as const to avoid TS7053
  private readonly NIE_MAP = { X: '0', Y: '1', Z: '2' } as const;

  constructor(
    private bdi: BdiService,
    private sisnet: SisnetService,
    private usoState: UsoConductoresStateService
  ) {
    this.documentos$ = this.bdi.getDocumentTypes().pipe(catchError(() => of([])));
    this.paises$ = this.bdi.getCountries().pipe(catchError(() => of([])));
    this.tiposCarnet$ = this.sisnet.getDrivingLicenseTypes().pipe(catchError(() => of([])));

    this.maxConductoresOcasionales = toSignal(
      this.sisnet.getNumberOfOccasionalDrivers().pipe(
        catchError(() => of(0))
      ),
      { initialValue: 0 }
    );
  }

  ngOnInit(): void {
    const saved = this.usoState.intervinientes();
    if (saved) {
      this.tomadorEsPropietario.set(saved.tomadorEsPropietario);
      this.tomadorEsConductorHabitual.set(saved.tomadorEsConductorHabitual);
      this.tomador = this.restorePersona(saved.tomador);
      this.propietario = this.restorePersona(saved.propietario);
      this.conductorHabitual = this.restorePersona(saved.conductorHabitual);
      this.conductoresOcasionales.set(
        (saved.conductoresOcasionales ?? []).map(item => this.restorePersona(item))
      );
      this.propietarioDireccion = saved.propietarioDireccion;
    }

    this.enforceAllCIFRules();
    this.checkCompletion();
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

  // ---------------- TOGGLES ----------------
  onTomadorEsPropietarioChange(checked: boolean): void {
    this.tomadorEsPropietario.set(checked);
    this.persistIntervinientesState();
    this.checkCompletion();
  }

  onTomadorEsConductorHabitualChange(checked: boolean): void {
    this.tomadorEsConductorHabitual.set(checked);
    this.persistIntervinientesState();
    this.checkCompletion();
  }

  // ---------------- OCASIONALES ----------------
  addConductorOcasional(): void {
    if (this.maxConductoresOcasionales() &&
        this.conductoresOcasionales().length >= this.maxConductoresOcasionales()) {
      return;
    }

    this.conductoresOcasionales.update(list => [
      ...list,
      {
        documento: 'NIF',
        numeroDocumento: '',
        pais: 'ES',
        fechaNacimiento: null,
        tipoCarnet: 'B',
        fechaObtencionCarnet: null,
        edadObtencionCarnet: undefined,
      }
    ]);
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

  // ---------------- INPUTS ----------------
  onDocumentoChange(model: Persona, newDocumento: string): void {
    // Si cambia el tipo de documento, limpiar el número para evitar validaciones cruzadas
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

  onSelectChange(event: any, model: any, field: string): void {
    const v = event?.detail ?? event?.detail?.value ?? event?.target?.value ?? event;
    model[field] = typeof v === 'object' && 'value' in v ? v.value : v;

    if (field === 'documento') {
      this.onDocumentoChange(model as Persona, model[field]);
      return;
    }

    this.persistIntervinientesState();
    this.checkCompletion();
  }

  // Robust date handler
  onDateChange(event: any, model: any, field: string): void {
    const iso = event?.detail ?? event?.detail?.value ?? event?.target?.value ?? null;
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

  // ---------------- DIRECCIÓN PROPIETARIO ----------------
  onPropietarioDireccionSave(model: DireccionModel): void {
    this.propietarioDireccion = model;
    this.persistIntervinientesState();
    this.checkCompletion();
  }

  onPropietarioDireccionCompleted(): void {
    this.persistIntervinientesState();
    this.checkCompletion();
  }

  // ---------------- VALIDACIÓN ----------------
  private isPersonaComplete(model: Persona, opts: { showCarnet: boolean; useEdad: boolean }): boolean {
    // Número de documento siempre obligatorio
    if (!model.documento) return false;
    if (!model.numeroDocumento || model.numeroDocumento.trim().length === 0) return false;
    if (!model.pais) return false;

    // Si el documento es NIF o NIE, validar formato
    if (model.documento === 'NIF' || model.documento === 'NIE') {
      if (!this.isDocumentoValid(model.numeroDocumento)) return false;
    }

    // Para pasaporte u otros tipos, exigir al menos 3 caracteres alfanuméricos
    if (model.documento === 'PASAPORTE') {
      if (!/^[A-Z0-9]{3,}$/.test(String(model.numeroDocumento).toUpperCase())) return false;
    }

    // Para CIF, número obligatorio but dates/carnet may be skipped
    if (model.documento === 'CIF') {
      // CIF format basic check
      if (!/^[A-HJ-NP-SUVW][0-9]{7}[0-9A-J]$/i.test(String(model.numeroDocumento))) return false;
      // no need to check fechaNacimiento or carnet for CIF
      return true;
    }

    // For non-CIF persons, fechaNacimiento required
    if (!model.fechaNacimiento) return false;

    if (opts.showCarnet) {
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
      propietarioOk = this.isPersonaComplete(this.propietario, { showCarnet: false, useEdad: false });
    }

    let conductorOk = true;
    if (!this.tomadorEsConductorHabitual()) {
      const conductorUseEdad = this.tomadorEsPropietario();
      conductorOk = this.isPersonaComplete(this.conductorHabitual, { showCarnet: true, useEdad: conductorUseEdad });
    }

    // validar conductores ocasionales
    const ocasionales = this.conductoresOcasionales();
    let ocasionalesOk = true;
    for (const oc of ocasionales) {
      // si aparece un conductor ocasional, su numeroDocumento debe ser válido
      if (!this.isPersonaComplete(oc, { showCarnet: true, useEdad: false })) {
        ocasionalesOk = false;
        break;
      }
    }

    let propietarioDireccionOk = true;
    if (!this.tomadorEsPropietario()) {
      propietarioDireccionOk =
        !!this.propietarioDireccion &&
        !!this.propietarioDireccion.domicilio &&
        this.propietarioDireccion.domicilio.trim().length > 0;
    }

    // persistir estado antes de marcar completitud
    this.persistIntervinientesState();

    const allComplete = tomadorOk && propietarioOk && conductorOk && propietarioDireccionOk && ocasionalesOk;

    // al final de checkCompletion()
    if (allComplete) {
      this.persistIntervinientesState();
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
    if (!model) {
      return;
    }

    let value = String(model.numeroDocumento ?? '').toUpperCase().replace(/[^A-Z0-9ÑXYZ]/g, '');
    value = value.replace(/^X/, 'X').replace(/^Y/, 'Y').replace(/^Z/, 'Z');

    model.numeroDocumento = value;
    this.persistIntervinientesState();
    this.checkCompletion();
  }

  isDocumentoValid(value: string): boolean {
    if (!value) return false;
    const v = String(value).toUpperCase().trim();

    // NIF: 8 dígitos + letra
    const nifRegex = /^[0-9]{8}[A-Z]$/;
    // NIE: X/Y/Z + 7 dígitos + letra
    const nieRegex = /^[XYZ][0-9]{7}[A-Z]$/;
    // CIF: letra + 7 dígitos + control (simplificado)
    const cifRegex = /^[A-HJ-NP-SUVW][0-9]{7}[0-9A-J]$/i;
    // Pasaporte: alfanumérico 3+ chars
    const passportRegex = /^[A-Z0-9]{3,}$/;

    if (nifRegex.test(v)) return this.validateNifControl(v);
    if (nieRegex.test(v)) return this.validateNieControl(v);
    if (cifRegex.test(v)) return true;
    if (passportRegex.test(v)) return true;

    return false;
  }

  // Validación control letra NIF (implementación estándar)
  validateNifControl(nif: string): boolean {
    if (!nif || nif.length !== 9) return false;
    const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
    const number = parseInt(nif.slice(0, 8), 10);
    if (Number.isNaN(number)) return false;
    const expected = letters[number % 23];
    return nif[8] === expected;
  }

  // Validación NIE: convertir X/Y/Z a 0/1/2 y validar como NIF
  validateNieControl(nie: string): boolean {
    if (!nie || nie.length !== 9) return false;

    const first = String(nie[0]).toUpperCase();
    const rest = nie.slice(1); // 8 chars: 7 digits + letter

    // guard: solo aceptar X/Y/Z
    if (!(first in this.NIE_MAP)) {
      return false;
    }

    // mapped value (typed)
    const mapped = this.NIE_MAP[first as keyof typeof this.NIE_MAP];
    const numericPart = mapped + rest.slice(0, 7); // 8 digits
    const checkLetter = rest[7];
    const nifLike = numericPart + checkLetter;

    return this.validateNifControl(nifLike);
  }

  numeroDocumentoError(model: Persona): string | null {
    if (!model.numeroDocumento || model.numeroDocumento.trim().length === 0) return 'Campo obligatorio';
    if ((model.documento === 'NIF' || model.documento === 'NIE') && !this.isDocumentoValid(model.numeroDocumento)) return 'Formato inválido';
    if (model.documento === 'CIF' && !/^[A-HJ-NP-SUVW][0-9]{7}[0-9A-J]$/i.test(String(model.numeroDocumento))) return 'Formato CIF inválido';
    return null;
  }
}
