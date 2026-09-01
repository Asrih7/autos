import { Component, computed, inject, OnDestroy, OnInit, signal, WritableSignal } from "@angular/core";
import { UpperCasePipe } from "@angular/common";
import {
  BalButton,
  BalField,
  BalFieldControl,
  BalFieldLabel,
  BalIcon,
  BalList,
  BalListItem,
  BalListItemAccordionBody,
  BalListItemAccordionHead,
  BalListItemContent,
  BalListItemIcon,
  BalListItemSubtitle,
  BalListItemTitle,
  BalSelect,
  BalSelectOption,
} from "@baloise/ds-angular";
import { PageNavigationService } from "@mnv-autos-ng/navigation";
import { TranslateModule } from "@ngx-translate/core";
import { GrupoModalidades, Modalidad } from "./models/modalidades.models";
import { DetalleGarantia, PeriodoCobro, PrecioCoberturasPageState, RecalcularModalidadEvent } from "./models/precio-coberturas.model";
import { GrupoModalidadesComponent } from "./steps/grupo-modalidades/grupo-modalidades.component";
import { PrecioCoberturasService } from "./services/precio-coberturas.service";
import { PrecioCoberturasStateService } from "./services/precio-coberturas-state.service";
import { capitalesFallecimientoMock, capitalesInvalidezMock, defaultCapitalesFallecimientoSeleccionado, defaultCapitalesInvalidezSeleccionado, defaultFraccionadoSeleccionado, defaultNumeroPlazasSeleccionado, modalidadesMock, numeroPlazasAseguradasMock, periodosCobroMock } from "./mocks/mock-modalidades";

@Component({
  selector: "app-precio-coberturas",
  standalone: true,
  imports: [
    GrupoModalidadesComponent,
    BalButton,
    BalField,
    BalFieldControl,
    BalFieldLabel,
    BalIcon,
    BalList,
    BalListItem,
    BalListItemAccordionBody,
    BalListItemAccordionHead,
    BalListItemContent,
    BalListItemIcon,
    BalListItemSubtitle,
    BalListItemTitle,
    BalSelect,
    BalSelectOption,
    TranslateModule,
    UpperCasePipe
  ],
  templateUrl: "./precio-coberturas.component.html",
  styleUrls: ["./precio-coberturas.component.scss"],
})
export class PrecioCoberturasComponent implements OnInit, OnDestroy {
  private readonly navService = inject(PageNavigationService);
  private readonly stateService = inject(PrecioCoberturasStateService);
  private readonly httpService = inject(PrecioCoberturasService);

  readonly baseLangKey = "precioCoberturas";

  readonly modalidades = signal<Modalidad[]>([]);
  readonly modalidadesAgrupadas = computed(() =>
    this.agruparModalidades(this.modalidades())
  );

  readonly periodosCobro = signal<PeriodoCobro[]>([]);
  readonly numeroPlazasAseguradas = signal<DetalleGarantia[]>([]);
  readonly capitalesFallecimiento = signal<DetalleGarantia[]>([]);
  readonly capitalesInvalidez = signal<DetalleGarantia[]>([]);

  readonly fraccionadoSeleccionado: WritableSignal<string> = signal("");
  readonly numeroPlazasSeleccionado: WritableSignal<string> = signal("");
  readonly capitalesFallecimientoSeleccionado: WritableSignal<string> = signal("");
  readonly capitalesInvalidezSeleccionado: WritableSignal<string> = signal("");

  isDisabledFraccionado: boolean = true;
  isDisabledOtrasOpciones: boolean = true;

  ngOnInit(): void {
    this.navService.activePageConfig.set({
      pageId: "precio-coberturas",
      previousPageUrl: "/uso-conductores",
      previousPageLabel: "Conductores",
      nextPageUrl: "/contratacion",
      nextPageLabel: "Guardar proyecto",
    });

    this.cargarPeriodosCobro();
    this.cargarGarantiaOcupantes();

    this.inicializarEstadoPagina();
  }

  ngOnDestroy(): void {
    this.navService.activePageConfig.set(null);
  }

  /**
   * Inicializa el estado de la página desde sesión si existe.
   * Si no existe, se inicializa con los valores por defecto.
   */
  private inicializarEstadoPagina(): void {
    const estadoSesion = this.stateService.obtenerEstado();

    if (estadoSesion) {
      this.modalidades.set(estadoSesion.modalidades);
      this.fraccionadoSeleccionado.set(estadoSesion.fraccionamiento);
      this.numeroPlazasSeleccionado.set(estadoSesion.numeroPlazasAseguradas);
      this.capitalesFallecimientoSeleccionado.set(estadoSesion.capitalesFallecimiento);
      this.capitalesInvalidezSeleccionado.set(estadoSesion.capitalesInvalidez);
      return;
    }

    // Se usan mocks mientras no existan datos por defecto ni modalidades desde backend
    this.modalidades.set(modalidadesMock);
    this.fraccionadoSeleccionado.set(defaultFraccionadoSeleccionado);
    this.numeroPlazasSeleccionado.set(defaultNumeroPlazasSeleccionado);
    this.capitalesFallecimientoSeleccionado.set(defaultCapitalesFallecimientoSeleccionado);
    this.capitalesInvalidezSeleccionado.set(defaultCapitalesInvalidezSeleccionado);
  }

  mockTarificar(body: PrecioCoberturasPageState): PrecioCoberturasPageState {
    // Cómo aún no tenemos el servicio de tarificación, simulamos la respuesta usando el mismo body
    return body;
  }

  //#region Fraccionamiento
  private cargarPeriodosCobro(): void {
    this.httpService.obtenerPeriodoCobro().subscribe({
      next: (periodos) => {
        if (periodos && periodos.length > 0) {
          this.periodosCobro.set(periodos);
        }
      },
      error: (error) => {
        console.error('Error al cargar los períodos de cobro: ', error);
        this.periodosCobro.set(periodosCobroMock);
      }
    });
  }

  onChangeFraccionado(event: CustomEvent): void {
    this.fraccionadoSeleccionado.set(event.detail);
    this.isDisabledFraccionado = false;
  }

  aplicarFraccionado(): void {
    this.isDisabledFraccionado = true;

    const body: PrecioCoberturasPageState = {
      modalidades: this.modalidades(),
      fraccionamiento: this.fraccionadoSeleccionado(),
      numeroPlazasAseguradas: this.numeroPlazasSeleccionado(),
      capitalesFallecimiento: this.capitalesFallecimientoSeleccionado(),
      capitalesInvalidez: this.capitalesInvalidezSeleccionado()
    }

    const response = this.mockTarificar(body);

    this.modalidades.set(response.modalidades);
    this.stateService.guardarEstado(response);
  }
  //#endregion Fraccionamiento

  //#region Lista modalidades
  /**
   * Agrupa una colección de modalidades por el código de su agrupación.
   * Una vez agrupadas las modalidades, se ordenan ascendentemente utilizando el campo `orden`.
   * 
   * @param modalidades Listado de modalidades a procesar.
   * @returns Colección de grupos de modalidades con título, código y modalidades ordenadas.
   */
  private agruparModalidades(modalidades: Modalidad[]): GrupoModalidades[] {
    return Object
      .values(
        modalidades.reduce(
          (acc, modalidad) => {
            const { agrupacion } = modalidad;

            if (!acc[agrupacion.codigo]) {
              acc[agrupacion.codigo] = {
                titulo: agrupacion.descripcion,
                codigo: agrupacion.codigo,
                modalidades: []
              };
            }

            acc[agrupacion.codigo].modalidades.push(modalidad);

            return acc;
          },
          {} as Record<string, GrupoModalidades>
        )
      )
      .map(grupo => ({
        ...grupo,
        modalidades: [...grupo.modalidades].sort(
          (a, b) => Number(a.orden) - Number(b.orden)
        )
      }));
  }

  /**
   * Actualiza una modalidad, ejecuta su retarificación y guarda el nuevo estado.
   *
   * @param event Evento con la modalidad actualizada.
   */
  onRecalcularModalidad(event: RecalcularModalidadEvent): void {
    // Construye el listado actualizado de modalidades
    const modalidadesActualizadas: Modalidad[] = this.modalidades().map(modalidad =>
      modalidad.codigo === event.modalidadActualizada.codigo
        ? event.modalidadActualizada
        : modalidad
    )

    // await Llamado a retarificación
    const modalidadesRetarificadas = this.retarificarModalidad(modalidadesActualizadas);

    const esGrupoTodoRiesgo = event.codigoGrupo === "TODO_RIESGO";
    const esModalidadConFranquicia =
      event.modalidadActualizada.franquicia !== null &&
      event.modalidadActualizada.franquicia !== 0;

    if (esGrupoTodoRiesgo && esModalidadConFranquicia) {
      const modalidadesReordenadas = this.reordenaModalidadesFranquicia(modalidadesRetarificadas.modalidades, event.modalidadActualizada);
      this.modalidades.set(modalidadesReordenadas);
      this.stateService.guardarEstado({ ...modalidadesRetarificadas, modalidades: modalidadesReordenadas });
    } else {
      this.modalidades.set(modalidadesRetarificadas.modalidades);
      this.stateService.guardarEstado(modalidadesRetarificadas);
    }
  }

  /**
   * Construye la petición de retarificación y devuelve el estado actualizado.
   *
   * @param modalidadesActualizadas Modalidades a retarificar.
   * @returns Estado resultante tras la retarificación.
   */
  retarificarModalidad(modalidadesActualizadas: Modalidad[]): PrecioCoberturasPageState {
    const body: PrecioCoberturasPageState = {
      modalidades: modalidadesActualizadas,
      fraccionamiento: this.fraccionadoSeleccionado(),
      numeroPlazasAseguradas: this.numeroPlazasSeleccionado(),
      capitalesFallecimiento: this.capitalesFallecimientoSeleccionado(),
      capitalesInvalidez: this.capitalesInvalidezSeleccionado()
    }

    const response = this.mockTarificar(body);

    return response;
  }


  /**
   * Ajusta la selección de las modalidades con franquicia del mismo grupo luego de una retarificación.
   *
   * @param modalidades Listado actualizado de modalidades.
   * @param modalidadActualizada Modalidad recalculada.
   * @returns Listado con la selección actualizada.
   */
  private reordenaModalidadesFranquicia(
    modalidades: Modalidad[],
    modalidadActualizada: Modalidad
  ): Modalidad[] {
    return modalidades.map(modalidad => {
      const perteneceAlMismoGrupo =
        modalidad.agrupacion.codigo === modalidadActualizada.agrupacion.codigo;

      if (!perteneceAlMismoGrupo) {
        return modalidad;
      }

      if (modalidad.codigo === modalidadActualizada.codigo) {
        return {
          ...modalidadActualizada,
          seleccionada: true
        };
      }

      if (modalidad.franquicia !== null && modalidad.franquicia !== 0) {
        return {
          ...modalidad,
          seleccionada: false
        };
      }

      return modalidad;
    });
  }
  //#endregion Lista modalidades

  //#region Otras opciones
  private cargarGarantiaOcupantes(): void {
    this.httpService.obtenerGarantiaOcupantes().subscribe({
      next: (opciones) => {
        if (opciones?.numeroPlazasAseguradas) {
          this.numeroPlazasAseguradas.set(opciones.numeroPlazasAseguradas)
        }
        if (opciones?.capitalesFallecimiento) {
          this.capitalesFallecimiento.set(opciones.capitalesFallecimiento)
        }
        if (opciones?.capitalesInvalidez) {
          this.capitalesInvalidez.set(opciones.capitalesInvalidez)
        }
      },
      error: (error) => {
        console.error('Error al cargar garantías de ocupantes: ', error);
        this.numeroPlazasAseguradas.set(numeroPlazasAseguradasMock);
        this.capitalesFallecimiento.set(capitalesFallecimientoMock);
        this.capitalesInvalidez.set(capitalesInvalidezMock);
      }
    });
  }

  onChangeOtrasOpciones(event: CustomEvent, key: string) {
    switch (key) {
      case 'numeroPlazasAseguradas':
        this.numeroPlazasSeleccionado.set(event.detail);
        break;
      case 'capitalesFallecimiento':
        this.capitalesFallecimientoSeleccionado.set(event.detail);
        break;
      case 'capitalesInvalidez':
        this.capitalesInvalidezSeleccionado.set(event.detail);
        break;
    }

    this.isDisabledOtrasOpciones = false;
  }

  aplicarOtrasOpciones(): void {
    this.isDisabledOtrasOpciones = true;

    const body: PrecioCoberturasPageState = {
      modalidades: this.modalidades(),
      fraccionamiento: this.fraccionadoSeleccionado(),
      numeroPlazasAseguradas: this.numeroPlazasSeleccionado(),
      capitalesFallecimiento: this.capitalesFallecimientoSeleccionado(),
      capitalesInvalidez: this.capitalesInvalidezSeleccionado()
    }

    const response = this.mockTarificar(body);

    this.modalidades.set(response.modalidades);
    this.stateService.guardarEstado(response);
  }
  //#endregion Otras opciones
}
