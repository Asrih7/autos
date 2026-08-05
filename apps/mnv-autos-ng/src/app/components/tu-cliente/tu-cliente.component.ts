import { Component, inject, OnDestroy, OnInit } from "@angular/core";
import { PageNavigationService } from '@mnv-autos-ng/navigation';
import {
  ClienteBusquedaService,
  DatosDomicilioService,
  provideDatosPersonaOptionsApi,
  validateSearchDocument,
  type ClienteBusquedaResult,
  type DatosDomicilioModel,
  type DatosPersonaModel,
} from '@mnv-autos-ng/ui';
import { FechaNacimiento } from "./steps/fecha-nacimiento/fecha-nacimiento.component";
import {
  TarjetaClienteEncontrado,
} from "./steps/tarjeta-cliente-encontrado/tarjeta-cliente-encontrado.component";
import { ClienteBusquedaComponent } from "./steps/cliente-busqueda/cliente-busqueda.component";
import { DireccionClienteComponent } from "./steps/direccion-cliente/direccion-cliente.component";
import { DatosPersonaStepComponent } from './steps/datos-persona/datos-persona.component';
import { TuClienteStateService } from "./tu-cliente-state.service";
import { BalButton, BalHeading } from "@baloise/ds-angular";
import { TranslateModule } from '@ngx-translate/core';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-tu-cliente',
  standalone: true,
  imports: [
    TarjetaClienteEncontrado,
    FechaNacimiento,
    DatosPersonaStepComponent,
    ClienteBusquedaComponent,
    DireccionClienteComponent,
    BalButton,
    BalHeading,
    TranslateModule,
  ],
  providers: [provideDatosPersonaOptionsApi()],
  templateUrl: './tu-cliente.component.html',
  styleUrls: ['./tu-cliente.component.scss'],
})
export class TuClienteComponent implements OnInit, OnDestroy {
  private readonly navService = inject(PageNavigationService);
  private readonly clienteService = inject(ClienteBusquedaService);
  private readonly domicilioService = inject(DatosDomicilioService);
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

    const validatedDocument = validateSearchDocument(query);
    if (!validatedDocument) {
      this.state.setClientSearchError('Por favor, ingresa un documento válido');
      return;
    }

    this.state.setSearching(true);
    this.state.setClientSearchError(null);
    this.state.setSearchAttempted(true);

    this.clienteService.buscarCliente(
      validatedDocument.documentNumber,
      validatedDocument.documentType,
    ).subscribe({
      next: (result: ClienteBusquedaResult | null) => {
        this.state.setSearching(false);
        if (result) {
          this.state.setClientResult(result);
          this.state.setClientNotFound(false);
        } else {
          this.state.setClientResult(null);
          this.state.setClientNotFound(true);
          this.state.setNewClientDocument(
            validatedDocument.documentType,
            validatedDocument.documentNumber,
          );
        }
      },
      error: () => {
        this.state.setSearching(false);
        this.state.setClientResult(null);
        this.state.setClientSearchError('No se ha podido consultar el cliente. Inténtalo de nuevo.');
      },
    });
  }

  protected handleClientQueryChange(query: string): void {
    this.state.setClientSearchQuery(query);
  }

  protected handleOperacionStart(type: 'cotizacion' | 'precotizacion'): void {
    if (this.state.clientNotFound()) {
      this.state.startOperacionFromNotFound(type);
      return;
    }

    if (this.state.startOperacion(type)) {
      void this.navService.navigateNext();
    }
  }

  protected handleEdit(): void {
    this.state.handleEdit();
  }

  protected handleDatosPersonaChange(model: DatosPersonaModel): void {
    this.state.setDatosPersona(model);
  }

  protected handleConfirmDatosPersona(): void {
    // If there is no found client result, this is the new-client flow and the
    // Confirmar button should advance to the next step without normalizing yet.
    if (!this.state.clientResult()) {
      this.state.confirmDatosPersona();
      return;
    }

    // When editing an existing (found) client, call the normalization endpoint
    // before confirming the data so the backend can normalize names.
    if (this.state.editingClient()) {
      this.clienteService.normalizarNombre(this.state.datosPersona()).subscribe({
        next: (persona) => {
          this.state.setDatosPersona(persona);
          this.state.confirmDatosPersona();
        },
        error: () => this.state.setClientSearchError('No se han podido validar los datos personales. Revísalos e inténtalo de nuevo.'),
      });
      return;
    }

    // For a found client that is not in edit mode, proceed directly to the next
    // step without a second normalization call.
    this.state.confirmDatosPersona();
  }

  protected handleDireccionChange(model: DatosDomicilioModel): void {
    this.state.setDireccion(model);
  }

  protected handleConfirmDireccion(): void {
    this.state.setNormalizingAddress(true);
    this.domicilioService.normalizeAddress(this.state.direccion()).pipe(
      finalize(() => this.state.setNormalizingAddress(false)),
    ).subscribe({
      next: (direccion) => {
        this.state.setDireccion(direccion);
        this.state.confirmDireccion();
      },
      error: () => this.state.setAddressError('No se ha podido validar la dirección. Revísala e inténtalo de nuevo.'),
    });
  }

  ngOnDestroy(): void {
    this.navService.activePageConfig.set(null);
  }
}
