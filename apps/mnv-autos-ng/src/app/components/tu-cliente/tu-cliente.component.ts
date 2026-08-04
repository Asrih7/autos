import { Component, inject, OnDestroy, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";
import { PageNavigationService } from '@mnv-autos-ng/navigation';
import { ClienteBusquedaService, DatosPersona, type DatosPersonaModel } from '@mnv-autos-ng/ui';
import { provideDatosPersonaOptionsApi } from './steps/datos-persona/data-access/datos-persona-http.service';
import { FechaNacimiento } from "./steps/fecha-nacimiento/fecha-nacimiento.component";
import {
  TarjetaClienteEncontrado,
  type TarjetaClienteEncontradoData,
} from "./steps/tarjeta-cliente-encontrado/tarjeta-cliente-encontrado.component";
import { ClienteBusquedaComponent } from "./steps/cliente-busqueda/cliente-busqueda.component";
import { DireccionClienteComponent } from "./steps/direccion-cliente/direccion-cliente.component";
import { TuClienteStateService } from "./tu-cliente-state.service";
import { BalButton, BalHeading } from "@baloise/ds-angular";

@Component({
  selector: 'app-tu-cliente',
  standalone: true,
  imports: [
    CommonModule,
    TarjetaClienteEncontrado,
    FechaNacimiento,
    DatosPersona,
    ClienteBusquedaComponent,
    DireccionClienteComponent,
    BalButton,
    BalHeading,
  ],
  providers: [provideDatosPersonaOptionsApi()],
  templateUrl: './tu-cliente.component.html',
  styleUrls: ['./tu-cliente.component.scss'],
})
export class TuClienteComponent implements OnInit, OnDestroy {
  private readonly navService = inject(PageNavigationService);
  private readonly clienteService = inject(ClienteBusquedaService);
  private readonly router = inject(Router);
  protected readonly state = inject(TuClienteStateService);

  ngOnInit(): void {
    this.navService.activePageConfig.set({
      pageId: 'tu-cliente',
      previousPageUrl: '',
      previousPageLabel: '',
      nextPageUrl: '/vehiculos',
      canContinueNext: () => this.state.canContinue(),
    });
  }

  protected handleClientSearch(query: string): void {
    if (!query.trim()) {
      this.state.setClientSearchError('Por favor, ingresa un documento válido');
      return;
    }

    this.state.setSearching(true);
    this.state.setClientSearchError(null);

    this.clienteService.buscarCliente(query).subscribe({
      next: (result: any) => {
        this.state.setSearching(false);
        if (result) {
          this.state.setClientResult(result);
        } else {
          this.state.setClientSearchError('Cliente no encontrado');
        }
      },
      error: (error: any) => {
        this.state.setSearching(false);
        this.state.setClientSearchError('Error al buscar el cliente');
        console.error('Client search error:', error);
      },
    });
  }

  protected handleClientQueryChange(query: string): void {
    this.state.setClientSearchQuery(query);
  }

  protected handleOperacionStart(type: 'cotizacion' | 'precotizacion'): void {
    const clientFound = this.state.startOperacion(type);
    
    // If client was found, navigate to next page immediately
    if (clientFound) {
      this.navService.navigateNext();
    }
    // Otherwise, show personal data form for new client
  }

  protected handleEdit(): void {
    this.state.handleEdit();
  }

  protected handleDatosPersonaChange(model: DatosPersonaModel): void {
    this.state.setDatosPersona(model);
  }

  protected handleConfirmDatosPersona(): void {
    this.state.confirmDatosPersona();
  }

  protected handleDireccionChange(model: any): void {
    this.state.setDireccion(model);
  }

  protected handleConfirmDireccion(): void {
    this.state.confirmDireccion();
  }

  protected handleBirthDateChange(value: string | undefined): void {
    this.state.setBirthDate(value);
  }

  ngOnDestroy(): void {
    this.navService.activePageConfig.set(null);
  }
}
