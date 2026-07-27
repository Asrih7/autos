import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  input,
  output,
} from "@angular/core";

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
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: "./tarjeta-cliente-encontrado.component.html",
  
})
export class TarjetaClienteEncontrado {
  readonly person = input.required<TarjetaClienteEncontradoData>();
  readonly edit = output<TarjetaClienteEncontradoData>();

  protected requestEdit(): void {
    this.edit.emit(this.person());
  }
}
