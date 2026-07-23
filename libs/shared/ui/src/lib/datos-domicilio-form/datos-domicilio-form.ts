import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, signal } from '@angular/core';
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
  @Output() codigoPostalChange = new EventEmitter<string>();

  tiposVia = signal<Array<{ label: string; value: string }>>([]);
  provincias = signal<Array<{ label: string; value: string }>>([]);
  localidades = signal<Array<{ label: string; value: string }>>([]);

  readonly internalModel = signal<DatosDomicilioModel>(EMPTY_DATOS_DOMICILIO);

  constructor(private readonly service: DatosDomicilioService) {
    this.service.getTiposVia().subscribe(items => this.tiposVia.set(items));
    this.service.getProvincias().subscribe(items => this.provincias.set(items));
  }

  ngOnChanges(_changes: SimpleChanges): void {
    this.internalModel.set({ ...this.model });

    if (this.internalModel().codigoPostal) {
      this.loadLocalidades(this.internalModel().codigoPostal);
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
    this.loadLocalidades(updated.codigoPostal);
    const provincia = this.service.getProvinciaForCodigoPostal(updated.codigoPostal);
    if (provincia && !updated.provincia) {
      updated.provincia = provincia;
    }
  }

  this.internalModel.set(updated);
  this.emitModel(updated);
}


  setCodigoPostal(value: string): void {
    const cp = value.toString().slice(0, 5);
    this.setField('codigoPostal', cp);
    this.codigoPostalChange.emit(cp);
  }

  updateModel(model: DatosDomicilioModel): void {
    this.internalModel.set({ ...model });
    this.loadLocalidades(model.codigoPostal);
    this.emitModel(model);
  }

  private loadLocalidades(codigoPostal: string): void {
    this.service.getLocalidades(codigoPostal).subscribe(items => {
      this.localidades.set(items);

      if (items.length === 1 && !this.internalModel().localidad) {
        this.internalModel.set({ ...this.internalModel(), localidad: items[0].value });
        this.emitModel(this.internalModel());
      }
    });
  }

  private emitModel(model: DatosDomicilioModel): void {
    this.modelChange.emit({ ...model });
  }
}
