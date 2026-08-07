import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { PageNavigationService } from '@mnv-autos-ng/navigation';
import {
  ClienteBusquedaService,
  DatosDomicilioService,
  DatosPersonaHttpService,
  provideDatosPersonaOptionsApi,
  validateDocumentNumber,
  validateSearchDocument,
  type ClienteBusquedaResult,
  type DatosDomicilioModel,
  type DatosPersonaModel,
} from '@mnv-autos-ng/ui';
import { BalButton, BalHeading, BalToast } from '@baloise/ds-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { catchError, finalize, of, switchMap } from 'rxjs';
import { ClienteBusquedaComponent } from './steps/cliente-busqueda/cliente-busqueda.component';
import { DatosPersonaStepComponent } from './steps/datos-persona/datos-persona.component';
import { DireccionClienteComponent } from './steps/direccion-cliente/direccion-cliente.component';
import { FechaNacimiento } from './steps/fecha-nacimiento/fecha-nacimiento.component';
import { TarjetaClienteEncontrado } from './steps/tarjeta-cliente-encontrado/tarjeta-cliente-encontrado.component';
import { TuClienteStateService } from './tu-cliente-state.service';

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
    BalToast,
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
  private readonly datosPersonaService = inject(DatosPersonaHttpService);
  private readonly translate = inject(TranslateService);

  protected readonly state = inject(TuClienteStateService);
  protected readonly normalizingPerson = signal(false);
  protected readonly toastOpen = signal(false);
  protected readonly toastMessage = signal('');
  protected readonly toastType = signal<'success' | 'info' | 'warning' | 'danger'>('success');
  protected readonly toastDurationMs = 3000;

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
      this.state.setClientSearchError(this.t('tuCliente.search.errors.invalidDocument'));
      return;
    }

    const validatedDocument = validateSearchDocument(query);
    if (!validatedDocument) {
      this.state.setClientSearchError(this.t('tuCliente.search.errors.invalidDocument'));
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
        this.state.setClientSearchError(this.t('tuCliente.search.errors.requestFailed'));
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
    const persona = this.state.datosPersona();
    const onlyNameFields = this.state.editingClient() && this.state.clientFound();

    if (!onlyNameFields) {
      const documentError = validateDocumentNumber(persona.documentType, persona.documentNumber);
      if (documentError) {
        this.showToast(this.t(`tuCliente.personalData.errors.${documentError}`), 'warning');
        return;
      }

      const nationalityRequired =
        persona.documentType !== undefined &&
        !['dni', 'nif', 'cif'].includes(persona.documentType) &&
        !persona.nationality?.trim();

      if (nationalityRequired) {
        this.showToast(this.t('tuCliente.personalData.errors.nationalityRequired'), 'warning');
        return;
      }

      this.state.confirmDatosPersona();
      this.showToast(this.t('tuCliente.feedback.personalDataValidated'), 'success');
      return;
    }

    const direccion = this.state.direccion();
    if (!this.isDireccionComplete(direccion)) {
      this.showToast(this.t('tuCliente.feedback.incompleteAddress'), 'warning');
      return;
    }

    this.normalizingPerson.set(true);
    this.state.setAddressError(null);
    this.state.setNormalizingAddress(true);

    this.datosPersonaService.normalizeName(persona).pipe(
      switchMap((normalizedPersona: DatosPersonaModel) => {
        this.state.setDatosPersona(normalizedPersona);
        return this.domicilioService.normalizeAddress(direccion).pipe(
          catchError(() => {
            const errorMessage = this.t('tuCliente.feedback.addressNormalizationFailed');
            this.state.setAddressError(errorMessage);
            this.showToast(errorMessage, 'warning');
            return of<DatosDomicilioModel | null>(null);
          }),
        );
      }),
      catchError(() => {
        this.showToast(this.t('tuCliente.feedback.personalDataNormalizationFailed'), 'danger');
        return of<DatosDomicilioModel | null>(null);
      }),
      finalize(() => {
        this.normalizingPerson.set(false);
        this.state.setNormalizingAddress(false);
      }),
    ).subscribe((normalizedDireccion: DatosDomicilioModel | null) => {
      if (!normalizedDireccion) {
        return;
      }

      this.state.setDireccion(normalizedDireccion);
      this.state.setAddressError(null);
      this.state.confirmDatosPersona();
      this.showToast(this.t('tuCliente.feedback.addressNormalized'), 'success');
    });
  }

  protected handleDireccionChange(model: DatosDomicilioModel): void {
    this.state.setDireccion(model);
  }

  protected handleConfirmDireccion(): void {
    if (!this.isDireccionComplete(this.state.direccion())) {
      this.showToast(this.t('tuCliente.feedback.incompleteAddress'), 'warning');
      return;
    }

    this.state.setAddressError(null);
    this.state.setNormalizingAddress(true);
    this.domicilioService.normalizeAddress(this.state.direccion()).pipe(
      catchError(() => {
        const errorMessage = this.t('tuCliente.feedback.addressNormalizationFailed');
        this.state.setAddressError(errorMessage);
        this.showToast(errorMessage, 'warning');
        return of<DatosDomicilioModel | null>(null);
      }),
      finalize(() => this.state.setNormalizingAddress(false)),
    ).subscribe((direccion: DatosDomicilioModel | null) => {
      if (!direccion) {
        return;
      }

      this.state.setDireccion(direccion);
      this.state.setAddressError(null);
      this.showToast(this.t('tuCliente.feedback.addressNormalized'), 'success');
      this.state.confirmDireccion();
    });
  }

  protected showToast(message: string, type: 'success' | 'info' | 'warning' | 'danger'): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.toastOpen.set(true);
  }

  private t(key: string): string {
    return this.translate.instant(key);
  }

  ngOnDestroy(): void {
    this.navService.activePageConfig.set(null);
  }

  private isDireccionComplete(direccion: DatosDomicilioModel): boolean {
    return [
      direccion.tipoVia,
      direccion.nombreVia,
      direccion.numero,
      direccion.codigoPostal,
      direccion.provincia,
      direccion.localidad,
    ].every((value) => value.trim().length > 0);
  }
}
