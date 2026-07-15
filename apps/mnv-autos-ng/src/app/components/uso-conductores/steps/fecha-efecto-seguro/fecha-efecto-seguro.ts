import { DateFormat, FechaEfectoSeguroPayload, FechaEfectoSeguroValor } from "@mnv-autos-ng/ui";
import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { UsoConductoresStateService } from '../../uso-conductores-state.service';

@Component({
  selector: 'app-fecha-efecto-seguro',
  standalone: true,
  imports: [DateFormat],
  templateUrl: './fecha-efecto-seguro.html',
  styleUrls: ['./fecha-efecto-seguro.scss'],
})
export class FechaEfectoSeguroComponent {
@Output() stepSelected = new EventEmitter<string>();
  private readonly usoState = inject(UsoConductoresStateService);

  @Input() valorInicial: Partial<FechaEfectoSeguroValor> | null = null;

  @Output() fechaChange = new EventEmitter<FechaEfectoSeguroPayload>();
  @Output() fechaSubmit = new EventEmitter<FechaEfectoSeguroPayload>();

  ngOnInit(): void {
      this.stepSelected.emit('fecha-efecto-seguro');
    const saved = this.usoState.fechaEfectoSeguro();

    if (saved.completed) {
      this.valorInicial = {
        dia: Number(saved.dia),
        mes: Number(saved.mes),
        anio: Number(saved.anio),
      };
    }
  }

  onFechaChange(payload: FechaEfectoSeguroPayload): void {
    this.persist(payload);
    this.fechaChange.emit(payload);
  }

  onFechaSubmit(payload: FechaEfectoSeguroPayload): void {
    this.persist(payload);
    this.fechaSubmit.emit(payload);
  }

  private persist(payload: FechaEfectoSeguroPayload): void {
    this.usoState.updateFechaEfectoSeguroState({
      dia: payload.dia.toString(),
      mes: payload.mes.toString(),
      anio: payload.anio.toString(),
      fechaISO: payload.fechaISO,
      completed: true,
    });
  }
}
