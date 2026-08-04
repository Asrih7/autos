import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  input,
  output,
} from "@angular/core";
import { BalIcon, BalButton } from "@baloise/ds-angular";
import { CommonModule } from "@angular/common";

export interface TarjetaClienteEncontradoData {
  name: string;
  clientType: string;
  documentType: string;
  documentNumber: string;
  nationality: string;
  age: number;
  address: string;
}

@Component({
  selector: "app-tarjeta-cliente-encontrado",
  standalone: true,
  imports: [CommonModule, BalIcon, BalButton],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: "./tarjeta-cliente-encontrado.component.html",
  styleUrl: "./tarjeta-cliente-encontrado.component.scss",
})
export class TarjetaClienteEncontrado {
  readonly person = input.required<TarjetaClienteEncontradoData>();
  readonly edit = output<TarjetaClienteEncontradoData>();

  protected requestEdit(): void {
    this.edit.emit(this.person());
  }
}
