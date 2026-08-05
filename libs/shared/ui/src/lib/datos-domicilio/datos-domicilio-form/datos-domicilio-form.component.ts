import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
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
} from '../models/address.model';
import { DatosDomicilioService } from '../services/datos-domicilio.service';
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
  templateUrl: './datos-domicilio-form.component.html',
})
export class DatosDomicilioForm implements OnChanges {
  @Input() model: DatosDomicilioModel = EMPTY_DATOS_DOMICILIO;
  @Input() disabled = false;

  @Output() modelChange = new EventEmitter<DatosDomicilioModel>();

  tiposVia = signal<Array<{ label: string; value: string }>>([]);
  localidades = signal<Array<{ label: string; value: string }>>([]);
  tipoViaSearch = signal('');

  @Input() fieldDisabled: {
    tipoVia: boolean;
    nombreVia: boolean;
    numero: boolean;
    codigoPostal: boolean;
    provincia: boolean;
    localidad: boolean;
  } = {
    tipoVia: true,
    nombreVia: true,
    numero: true,
    codigoPostal: true,
    provincia: true,
    localidad: true
  };

  private readonly provinciasCatalogo = signal<Array<{ label: string; value: string }>>([]);
  private readonly provinciasPorCp = signal<Array<{ label: string; value: string }> | null>(null);

  /** El listado del CP manda si existe; si no, cae al catálogo general.
   *  Nunca deja fuera el valor ya seleccionado, venga de donde venga. */
  readonly provincias = computed(() => {
    const base = this.provinciasPorCp() ?? this.provinciasCatalogo();
    const current = this.internalModel().provincia?.trim();
    if (current && !base.some(item => item.value.trim().toLocaleLowerCase() === current.toLocaleLowerCase())) {
      return [{ label: current, value: current }, ...base];
    }
    return base;
  });
  // ---------------------------------------------------------------------

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

  // FIX: referencias a los <bal-select> nativos (Stencil) de Provincia y
  // Localidad, para poder reasignar su `value` de forma imperativa una vez
  // que sus <bal-select-option> ya estén montadas en el DOM.
  @ViewChild('provinciaSelect') provinciaSelectRef?: ElementRef<HTMLElement & { value: string }>;
  @ViewChild('localidadSelect') localidadSelectRef?: ElementRef<HTMLElement & { value: string }>;

  constructor(private readonly service: DatosDomicilioService) {
    // FIX: solo alimenta el catálogo general. Ya NO pisa nunca el resultado
    // específico del CP (antes ambas escribían la misma signal `provincias`
    // y ganaba quien respondiera último, dando resultados no deterministas).
    this.service.getProvincias().subscribe((items: { label: string; value: string }[]) =>
      this.provinciasCatalogo.set(items),
    );
    this.tipoViaSearchInput$
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap(() => this.service.getTiposVia()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((items) => this.tiposVia.set(items));

    // FIX: bal-select (Stencil) puede no reflejar el value si las
    // <bal-select-option> se acaban de recrear en el mismo ciclo (p.ej. tras
    // llegar la respuesta del CP). Forzamos la reasignación del value en un
    // microtask posterior, cuando las opciones ya están conectadas al DOM.
    effect(() => {
      const provinciaValue = this.internalModel().provincia;
      this.provincias();

      const assign = () => {
        const el = this.provinciaSelectRef?.nativeElement;
        if (el && el.value !== provinciaValue) {
          el.value = provinciaValue;
        }
      };

      // FIX: esperamos a que bal-select esté realmente definido como custom
      // element antes de asignar el value; un solo microtask no siempre es
      // suficiente margen si el componente Stencil aún se está registrando.
      customElements.whenDefined('bal-select').then(() => {
        queueMicrotask(assign);
      });
    });

    effect(() => {
      const localidadValue = this.internalModel().localidad;
      this.localidades();

      const assign = () => {
        const el = this.localidadSelectRef?.nativeElement;
        if (el && el.value !== localidadValue) {
          el.value = localidadValue;
        }
      };

      customElements.whenDefined('bal-select').then(() => {
        queueMicrotask(assign);
      });
    });
  }

  ngOnChanges(_changes: SimpleChanges): void {
    this.internalModel.set({ ...this.model });
    this.tipoViaSearch.set(this.internalModel().tipoVia);

    if (this.internalModel().codigoPostal) {
      this.loadAddressData(this.internalModel().codigoPostal);
    } else {
      this.localidades.set([]);
      this.provinciasPorCp.set(null); // FIX: sin CP, vuelve al catálogo general
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
      this.provinciasPorCp.set(null); // FIX
      return;
    }

    if (this.lastLoadedPostalCode === normalizedPostalCode) return;
    this.lastLoadedPostalCode = normalizedPostalCode;

    this.service.getAddressData(normalizedPostalCode).subscribe(({ localidades, provincias, provincia }) => {
      this.localidades.set(localidades);

      // FIX: ya no se escribe la signal `provincias` directamente ni se hace
      // el unshift a mano aquí (ese cálculo ahora vive una sola vez en el computed).
      this.provinciasPorCp.set(
        provincias.length > 0 ? provincias : provincia ? [{ label: provincia, value: provincia }] : [],
      );

      const current = this.internalModel();
      const matchingLocalidad = localidades.find(
        (item) => item.value.trim().toLocaleLowerCase() === current.localidad.trim().toLocaleLowerCase(),
      )?.value;
      // Google puede devolver el municipio mientras BDI devuelve población;
      // si no hay una coincidencia exacta, en modo Google usamos la primera
      // localidad válida de BDI para que el select siempre tenga valor.
      const localidad =
        matchingLocalidad ??
        ((this.disabled || !current.localidad.trim() || localidades.length === 1) && localidades.length > 0
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