import { CommonModule } from '@angular/common';
import { BalButton } from '@baloise/ds-angular';
import { Component, inject, OnDestroy, OnInit } from "@angular/core";
import { PageNavigationService } from '@mnv-autos-ng/navigation';
import { ClienteBusquedaService, type DatosPersonaModel, DatosDomicilioModel } from '@mnv-autos-ng/ui';
import { TuClienteStateService } from './tu-cliente-state.service';
import { DatosPersonaComponent } from './steps/datos-persona/datos-persona.component';
import { FechaNacimientoComponent } from './steps/fecha-nacimiento/fecha-nacimiento.component';
import {
  TarjetaClienteEncontrado,
  type TarjetaClienteEncontradoData,
} from "./steps/tarjeta-cliente-encontrado/tarjeta-cliente-encontrado.component";
import { ClienteBusquedaComponent } from './steps/cliente-busqueda/cliente-busqueda.component';
import { DireccionClienteComponent } from './steps/direccion-cliente/direccion-cliente.component';

type OperacionTipo = 'cotizacion' | 'precotizacion';

@Component({
  selector: 'app-tu-cliente',
  standalone: true,
  imports: [
    CommonModule,
    ClienteBusquedaComponent,
    TarjetaClienteEncontrado,
    DatosPersonaComponent,
    DireccionClienteComponent,
    FechaNacimientoComponent,
    BalButton,
  ],
  templateUrl: './tu-cliente.component.html',
  styleUrls: ['./tu-cliente.component.scss'],
})
export class TuClienteComponent implements OnInit, OnDestroy {
  private readonly clienteService = inject(ClienteBusquedaService);
  private readonly navService = inject(PageNavigationService);
  private readonly state = inject(TuClienteStateService);

  protected readonly clientSearchQuery = this.state.clientSearchQuery;
  protected readonly clientSearchError = this.state.clientSearchError;
  protected readonly searching = this.state.searching;
  protected readonly clientResult = this.state.clientResult;
  protected readonly operationType = this.state.operationType;
  protected readonly showPersonalDataStep = this.state.showPersonalDataStep;
  protected readonly showAddressStep = this.state.showAddressStep;
  protected readonly showBirthdateStep = this.state.showBirthdateStep;
  protected readonly editingClient = this.state.editingClient;

  protected readonly datosPersona = this.state.datosPersona;
  protected readonly direccion = this.state.direccion;
  protected readonly birthDate = this.state.birthDate;

  protected readonly canContinue = this.state.canContinue;

  ngOnInit(): void {
    this.navService.activePageConfig.set({
      pageId: 'tu-cliente',
      previousPageUrl: '',
      previousPageLabel: '',
      nextPageUrl: '/vehiculos',
      beforeNavigateNext: () => this.canContinue(),
      isNextButtonEnabled: () => this.canContinue(),
    });
  }

  ngOnDestroy(): void {
    this.navService.activePageConfig.set(null);
  }

  protected handleSearchValueChange(value: string): void {
    this.state.setClientSearchQuery(value);
    this.state.setClientSearchError(null);
  }

  protected searchCliente(documento: string): void {
    const trimmed = documento.trim();
    if (!trimmed) {
      this.state.setClientSearchError('Introduce un DNI, NIE o CIF');
      return;
    }

    this.state.setSearching(true);
    this.state.setClientSearchError(null);

    this.clienteService.buscarCliente(trimmed).subscribe({
      next: (result) => {
        this.state.setSearching(false);
        this.state.setClientResult(result);
      },
      error: () => {
        this.state.setSearching(false);
        this.state.setClientSearchError('Error al buscar el cliente. Inténtalo de nuevo.');
      },
    });
  }

  protected startOperacion(type: OperacionTipo): void {
    const clientExists = this.clientResult() !== null;
    this.state.startOperacion(type);

    if (clientExists) {
      void this.navService.navigateNext();
    }
  }

  protected handleEdit(person: TarjetaClienteEncontradoData): void {
    this.state.handleEdit();
  }

  protected handleDatosPersonaChange(model: DatosPersonaModel): void {
    this.state.setDatosPersona(model);
  }

  protected confirmDatosPersona(): void {
    this.state.confirmDatosPersona();
  }

  protected handleDireccionChange(address: DatosDomicilioModel): void {
    this.state.setDireccion(address);
  }

  protected confirmDireccion(): void {
    this.state.confirmDireccion();
  }

  protected handleBirthdateChange(value: string | undefined): void {
    this.state.setBirthDate(value);
  }
}
