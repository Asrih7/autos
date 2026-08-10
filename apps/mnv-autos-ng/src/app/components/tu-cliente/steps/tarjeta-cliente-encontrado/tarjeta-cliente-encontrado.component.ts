import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  input,
  output,
} from "@angular/core";
import { BalIcon, BalButton, BalCard, BalCardContent } from "@baloise/ds-angular";
import { CommonModule } from "@angular/common";
import { TranslateModule } from '@ngx-translate/core';
import type { TarjetaClienteEncontradoData } from "@mnv-autos-ng/ui";



@Component({
  selector: "app-tarjeta-cliente-encontrado",
  standalone: true,
  imports: [CommonModule, TranslateModule, BalIcon, BalButton, BalCard, BalCardContent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: "./tarjeta-cliente-encontrado.component.html",
  styleUrls: ["./tarjeta-cliente-encontrado.component.scss"],
})
export class TarjetaClienteEncontrado {
  readonly person = input.required<TarjetaClienteEncontradoData>();
  readonly edit = output<TarjetaClienteEncontradoData>();

  protected requestEdit(): void {
    this.edit.emit(this.person());
  }
  
}
