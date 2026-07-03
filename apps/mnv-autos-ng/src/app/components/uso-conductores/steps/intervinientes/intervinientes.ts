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

import { BdiService } from '../../services/bdi.service';
import { SisnetService } from '../../services/sisnet.service';

import { Persona } from '../../models/persona.model';
import { UsoConductoresStateService } from '../../uso-conductores-state.service';
import { DireccionTomadorComponent } from './components/direccion-tomador/direccion-tomador.component';
import { DireccionPropietarioComponent } from '../direccion-propietario/direccion-propietario';

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
    DireccionPropietarioComponent
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

  // NUEVO: dirección del propietario
  propietarioDireccion: any = {
    calle: '',
    numero: '',
    cp: '',
    poblacion: '',
    provincia: '',
    pais: 'ES'
  };

  private hasEmittedCompleted = false;

  constructor(
    private stateService: UsoConductoresStateService,
    private bdi: BdiService,
    private sisnet: SisnetService
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
    this.enforceAllCIFRules();
  }

  onDocumentoChange(model: Persona, newDocumento: string): void {
    model.documento = newDocumento;
    if (newDocumento === 'CIF') {
      model.fechaNacimiento = null;
      model.fechaObtencionCarnet = null;
      model.tipoCarnet = undefined;
      model.edadObtencionCarnet = undefined;
    }
    this.enforceAllCIFRules();
    this.checkCompletion();
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
        if (this.tomador.documento === 'CIF' || this.propietario.documento === 'CIF') {
          oc.documento = 'NIF';
        }
        oc.fechaNacimiento = null;
        oc.fechaObtencionCarnet = null;
        oc.tipoCarnet = undefined;
        oc.edadObtencionCarnet = undefined;
      }
    });

    [this.tomador, this.propietario, this.conductorHabitual].forEach(p => {
      if (p.documento === 'CIF') {
        p.fechaNacimiento = null;
        p.fechaObtencionCarnet = null;
        p.tipoCarnet = undefined;
        p.edadObtencionCarnet = undefined;
      }
    });
  }

  onTomadorEsPropietarioChange(checked: boolean): void {
    this.tomadorEsPropietario.set(checked);
    this.checkCompletion();
  }

  onTomadorEsConductorHabitualChange(checked: boolean): void {
    this.tomadorEsConductorHabitual.set(checked);
    this.checkCompletion();
  }

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
  }

  removeConductorOcasional(index: number): void {
    this.conductoresOcasionales.update(list => {
      const copy = [...list];
      if (index >= 0 && index < copy.length) {
        copy.splice(index, 1);
      }
      return copy;
    });
    this.checkCompletion();
  }

  onSelectChange(event: any, model: any, field: string): void {
    const v = event?.detail ?? event?.detail?.value ?? event?.target?.value ?? event;
    model[field] = typeof v === 'object' && 'value' in v ? v.value : v;
    if (field === 'documento') {
      this.onDocumentoChange(model, model[field]);
      return;
    }
    this.checkCompletion();
  }

  onInputChange(event: any, model: any, field: string): void {
    const v = event?.detail ?? event?.detail?.value ?? event?.target?.value ?? event;
    model[field] = typeof v === 'object' && 'value' in v ? v.value : v;
    this.checkCompletion();
  }

  onDateChange(event: any, model: any, field: string): void {
    const iso = event?.detail ?? event?.detail?.value ?? event?.target?.value ?? null;
    model[field] = iso ? this.isoToDate(String(iso)) : null;
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

  // NUEVO: actualización de domicilio del propietario
  onPropietarioDireccionChange(newValue: any): void {
    this.propietarioDireccion = newValue;
    this.checkCompletion();
  }

  // ---------- LÓGICA DE "TODO RELLENADO" ----------
  private isPersonaComplete(model: Persona, opts: { showCarnet: boolean; useEdad: boolean }): boolean {
    if (!model.numeroDocumento || String(model.numeroDocumento).trim().length === 0) return false;
    if (!model.pais) return false;
    if (model.documento === 'CIF') return true;

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

    // NUEVO: validación del domicilio del propietario
    let propietarioDireccionOk = true;
    if (!this.tomadorEsPropietario()) {
      propietarioDireccionOk =
        !!this.propietarioDireccion.calle &&
        !!this.propietarioDireccion.numero &&
        !!this.propietarioDireccion.cp &&
        !!this.propietarioDireccion.poblacion &&
        !!this.propietarioDireccion.provincia;
    }

    const allComplete = tomadorOk && propietarioOk && propietarioDireccionOk && conductorOk;

    if (allComplete && !this.hasEmittedCompleted) {
      this.hasEmittedCompleted = true;
      this.intervinientesCompleted.emit();
      this.stateService.completeIntervinientes();
    } else if (!allComplete && this.hasEmittedCompleted) {
      this.hasEmittedCompleted = false;
    }
  }
}
