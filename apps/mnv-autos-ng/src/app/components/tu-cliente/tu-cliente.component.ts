import { Component, inject, OnDestroy, OnInit, signal } from "@angular/core";
import { PageNavigationService } from '@mnv-autos-ng/navigation';
import { provideDatosPersonaOptionsApi } from './steps/datos-persona/data-access/datos-persona-http.service';
import { DatosPersona } from './steps/datos-persona/datos-persona.component';
import { FechaNacimiento } from "./steps/fecha-nacimiento/fecha-nacimiento.component";
import {
  TarjetaClienteEncontrado,
  type TarjetaClienteEncontradoData,
} from "./steps/tarjeta-cliente-encontrado/tarjeta-cliente-encontrado.component";

@Component({
  selector: 'app-tu-cliente',
  standalone: true,
  imports: [TarjetaClienteEncontrado, FechaNacimiento, DatosPersona],
  providers: [provideDatosPersonaOptionsApi()],
  templateUrl: './tu-cliente.component.html',
  styleUrls: ['./tu-cliente.component.scss'],
})
export class TuClienteComponent implements OnInit, OnDestroy {
  protected readonly person: TarjetaClienteEncontradoData = {
    name: "Ana Torres Fernández",
    clientType: "Cliente platino",
    documentType: "DNI",
    documentNumber: "11843928V",
    nationality: "Española",
    age: 49,
    address: "Calle Jaime Arjona 29, 4D, 28017 Madrid",
  };

  protected readonly lastEvent = signal("Sin eventos todavia");

  protected handleEdit(person: TarjetaClienteEncontradoData): void {
    const time = new Date().toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    this.lastEvent.set(`Editar: ${person.name} (${time})`);
  }

  protected readonly birthDate = signal<string | undefined>(undefined);
  private readonly navService = inject(PageNavigationService);

  ngOnInit(): void {
    this.navService.activePageConfig.set({
      pageId: 'tu-cliente',
      previousPageUrl: '',
      previousPageLabel: '',
      nextPageUrl: '/vehiculos',
    });
  }

  ngOnDestroy(): void {
    this.navService.activePageConfig.set(null);
  }
}
