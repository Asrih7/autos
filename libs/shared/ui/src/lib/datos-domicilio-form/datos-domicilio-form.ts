import { CommonModule } from '@angular/common';
import { Component, DestroyRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import {
  BalField,
  BalFieldControl,
  BalFieldLabel,
  BalInput,
  BalSelect,
  BalSelectOption,
  BalHeading,
} from '@baloise/ds-angular';
import { TranslateModule } from '@ngx-translate/core';
import {
  DatosDomicilioModel,
  EMPTY_DATOS_DOMICILIO,
} from '../address.model';
import { DatosDomicilioService } from '../datos-domicilio.service';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

@Component({
  selector: 'app-datos-domicilio-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BalField,
    BalFieldControl,
    BalFieldLabel,
    BalInput,
    BalSelect,
    BalSelectOption,
    BalHeading,
    TranslateModule,
  ],
  templateUrl: './datos-domicilio-form.html',
})
export class DatosDomicilioForm implements OnChanges {
  @Input() model: DatosDomicilioModel = EMPTY_DATOS_DOMICILIO;
  @Input() disabled = false;

  @Output() modelChange = new EventEmitter<DatosDomicilioModel>();

  tiposVia = signal<Array<{ label: string; value: string }>>([]);
  provincias = signal<Array<{ label: string; value: string }>>([]);
  localidades = signal<Array<{ label: string; value: string }>>([]);
  tipoViaSearch = signal('');

  readonly internalModel = signal<DatosDomicilioModel>(EMPTY_DATOS_DOMICILIO);
  readonly filteredTiposVia = computed(() => {
    const search = this.tipoViaSearch().trim().toLocaleLowerCase();
    if (!search) return [];
    return this.tiposVia()
      .filter((item) => item.label.toLocaleLowerCase().includes(search))
      .slice(0, 10);
  });
  private lastLoadedPostalCode = '';
  private readonly destroyRef = inject(DestroyRef);
  private readonly tipoViaSearchInput$ = new Subject<string>();

  constructor(private readonly service: DatosDomicilioService) {
    this.service.getProvincias().subscribe((items: { label: string; value: string }[]) => this.provincias.set(items));
    this.tipoViaSearchInput$
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap(() => this.service.getTiposVia()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((items) => this.tiposVia.set(items));
  }

  ngOnChanges(_changes: SimpleChanges): void {
    this.internalModel.set({ ...this.model });
    this.tipoViaSearch.set(this.internalModel().tipoVia);

    if (this.internalModel().codigoPostal) {
      this.loadAddressData(this.internalModel().codigoPostal);
    } else {
      this.localidades.set([]);
    }
  }

  setField(field: keyof DatosDomicilioModel, event: any): void {
    const detail = event?.detail;
    const normalizedValue =
      detail?.value ??
      detail ??
      (event as any)?.value ??
      event ??
      '';

    const updated = { ...this.internalModel(), [field]: String(normalizedValue) };

    if (field === 'codigoPostal') {
      const codigoPostal = updated.codigoPostal.slice(0, 5);
      updated.codigoPostal = codigoPostal;
    }

    this.internalModel.set(updated);
    if (field === 'codigoPostal') {
      this.loadAddressData(updated.codigoPostal);
    }
    this.emitModel(updated);
  }


  setCodigoPostal(value: string): void {
    const cp = value.toString().slice(0, 5);
    this.setField('codigoPostal', cp);
  }

  updateModel(model: DatosDomicilioModel): void {
    this.internalModel.set({ ...model });
    this.tipoViaSearch.set(model.tipoVia);
    this.loadAddressData(model.codigoPostal);
    this.emitModel(model);
  }

  onTipoViaInput(event: any): void {
    const value = String(event?.detail?.value ?? event?.detail ?? event?.target?.value ?? '').trimStart();
    this.tipoViaSearch.set(value);
    this.setField('tipoVia', value);
    this.tipoViaSearchInput$.next(value);
  }

  selectTipoVia(value: string): void {
    this.tipoViaSearch.set(value);
    this.setField('tipoVia', value);
  }

  private loadAddressData(codigoPostal: string): void {
    const normalizedPostalCode = codigoPostal.slice(0, 5);
    if (normalizedPostalCode.length < 5) {
      this.lastLoadedPostalCode = '';
      this.localidades.set([]);
      return;
    }

    if (this.lastLoadedPostalCode === normalizedPostalCode) return;
    this.lastLoadedPostalCode = normalizedPostalCode;

    this.service.getAddressData(normalizedPostalCode).subscribe(({ localidades, provincias, provincia }) => {
      this.localidades.set(localidades);
      if (provincias.length > 0) {
        this.provincias.set(provincias);
      } else if (provincia) {
        this.provincias.set([{ label: provincia, value: provincia }]);
      }
      const current = this.internalModel();
      const matchingLocalidad = localidades.find(
        (item) => item.value.trim().toLocaleLowerCase() === current.localidad.trim().toLocaleLowerCase(),
      )?.value;
      // Google puede devolver el municipio mientras BDI devuelve población;
      // si no hay una coincidencia exacta, en modo Google usamos la primera
      // localidad válida de BDI para que el select siempre tenga valor.
      const localidad = matchingLocalidad
        ?? ((this.disabled || localidades.length === 1) && localidades.length > 0
          ? localidades[0].value
          : current.localidad);
      const updated = {
        ...current,
        provincia: provincia ?? current.provincia,
        localidad,
      };

      if (updated.provincia !== current.provincia || updated.localidad !== current.localidad) {
        this.internalModel.set(updated);
        this.emitModel(updated);
      }
    });
  }

  private emitModel(model: DatosDomicilioModel): void {
    this.modelChange.emit({ ...model });
  }
}
