import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  AfterViewInit,
  OnInit,
  OnChanges,
  SimpleChanges,
  signal,
} from '@angular/core';

import {
  BalField,
  BalFieldControl,
  BalFieldMessage,
  BalInput,
  BalHeading
} from '@baloise/ds-angular';

import { TranslateModule } from '@ngx-translate/core';

export interface FechaEfectoSeguroValor {
  dia: number;
  mes: number;
  anio: number;
}

export interface FechaEfectoSeguroPayload extends FechaEfectoSeguroValor {
  fechaISO: string;
}

@Component({
  selector: 'date-format',
  standalone: true,
  imports: [
    BalField,
    BalFieldControl,
    BalFieldMessage,
    BalInput,
    TranslateModule,
    BalHeading
  ],
templateUrl: './date-format.component.html',
  styleUrls: ['./date-format.component.scss'],
})
export class DateFormat
  implements OnInit, OnChanges, AfterViewInit {

  @ViewChild('diaInput')
  private readonly diaInput?: any;

  @Input() valorInicial: Partial<FechaEfectoSeguroValor> | null = null;

  @Output() fechaChange = new EventEmitter<FechaEfectoSeguroPayload>();
  @Output() fechaSubmit = new EventEmitter<FechaEfectoSeguroPayload>();

  protected readonly dia = signal('');
  protected readonly mes = signal('');
  protected readonly anio = signal('');
  protected readonly error = signal<string | null>(null);

  ngAfterViewInit(): void {
    setTimeout(() => {
      const el = this.diaInput?.nativeElement ?? this.diaInput;
      if (el?.setFocus) el.setFocus();
      else if (el?.focus) el.focus();
    });
  }

  ngOnInit(): void {
    this.aplicarValorInicial();
    this.emitirCambioSiEsValido();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['valorInicial'] && !changes['valorInicial'].firstChange) {
      this.aplicarValorInicial();
      this.emitirCambioSiEsValido();
    }
  }

  protected onFechaInput(event: unknown, campo: 'dia' | 'mes' | 'anio'): void {
    this.setCampo(campo, this.readInputValue(event));
    this.normalizarEntrada(campo);
    this.emitirCambioSiEsValido();
  }

  protected enviar(): void {
    this.formatearDiaMes();
    const payload = this.crearPayload();
    if (payload) this.fechaSubmit.emit(payload);
  }

  private aplicarValorInicial(): void {
    this.dia.set(this.formatearDosDigitos(this.valorInicial?.dia));
    this.mes.set(this.formatearDosDigitos(this.valorInicial?.mes));
    this.anio.set(this.valorInicial?.anio?.toString() ?? '');
  }

  private emitirCambioSiEsValido(): void {
    const payload = this.crearPayload();
    if (payload) this.fechaChange.emit(payload);
  }

  private crearPayload(): FechaEfectoSeguroPayload | null {
    if (!this.dia() || !this.mes() || !this.anio()) {
      this.error.set(null);
      return null;
    }

    const dia = Number(this.dia());
    const mes = Number(this.mes());
    const anio = Number(this.anio());

    if (!this.esFechaValida(dia, mes, anio)) {
      this.error.set('Introduce una fecha valida.');
      return null;
    }

    this.error.set(null);

    return {
      dia,
      mes,
      anio,
      fechaISO: `${anio.toString().padStart(4, '0')}-${mes.toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`,
    };
  }

  private normalizarEntrada(campo: 'dia' | 'mes' | 'anio'): void {
    const max = campo === 'anio' ? 4 : 2;
    this.setCampo(campo, this.getCampo(campo).replace(/\D/g, '').slice(0, max));
  }

  private readInputValue(event: unknown): string {
    const source = event as any;
    const value =
      source?.detail?.value ??
      source?.detail ??
      source?.target?.value ??
      source ??
      '';

    if (typeof value === 'object' && value !== null && 'value' in value) {
      return String(value.value ?? '');
    }

    return String(value);
  }

  private setCampo(campo: 'dia' | 'mes' | 'anio', value: string): void {
    if (campo === 'dia') return this.dia.set(value);
    if (campo === 'mes') return this.mes.set(value);
    this.anio.set(value);
  }

  private getCampo(campo: 'dia' | 'mes' | 'anio'): string {
    if (campo === 'dia') return this.dia();
    if (campo === 'mes') return this.mes();
    return this.anio();
  }

  private formatearDosDigitos(valor: number | string | null | undefined): string {
    if (valor === undefined || valor === null || valor === '') return '';
    return valor.toString().padStart(2, '0');
  }

 public formatearDiaMes(): void {
  this.dia.set(this.formatearDosDigitos(this.dia()));
  this.mes.set(this.formatearDosDigitos(this.mes()));
  this.emitirCambioSiEsValido();
}


  private esFechaValida(dia: number, mes: number, anio: number): boolean {
    if (!Number.isInteger(dia) || !Number.isInteger(mes) || !Number.isInteger(anio)) {
      return false;
    }

    if (anio < 1900 || anio > 2100 || mes < 1 || mes > 12) {
      return false;
    }

    const diasDelMes = new Date(anio, mes, 0).getDate();
    return dia >= 1 && dia <= diasDelMes;
  }
}
