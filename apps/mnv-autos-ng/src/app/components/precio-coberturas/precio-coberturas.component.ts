import { Component, computed, inject, OnDestroy, OnInit, signal } from "@angular/core";
import { PageNavigationService } from "@mnv-autos-ng/navigation";
import { GrupoModalidadesComponent } from "./steps/grupo-modalidades/grupo-modalidades.component";
import { Cobertura, GrupoModalidades, Modalidad } from "./models/modalidades.models";
import { PrecioCoberturasStateService } from "./services/precio-coberturas-state.service";
import { EstadoEdicionPagina, PrecioCoberturasPageState, RecalcularModalidadEvent } from "./models/precio-coberturas-state.model";

@Component({
  selector: "app-precio-coberturas",
  standalone: true,
  imports: [GrupoModalidadesComponent],
  templateUrl: "./precio-coberturas.component.html",
  styleUrls: ["./precio-coberturas.component.scss"],
})
export class PrecioCoberturasComponent implements OnInit, OnDestroy {
  private readonly navService = inject(PageNavigationService);
  private readonly stateService = inject(PrecioCoberturasStateService);

  ngOnInit(): void {
    this.navService.activePageConfig.set({
      pageId: "precio-coberturas",
      previousPageUrl: "/uso-conductores",
      previousPageLabel: "Conductores",
      nextPageUrl: "/contratacion",
    });

    this.inicializarEstadoPagina();
  }

  ngOnDestroy(): void {
    this.navService.activePageConfig.set(null);
  }

  //#region MOCKS
  coberturasIncluidasMock: Cobertura[] = [
    {
      codigo: 'RC1',
      descripcion: 'Responsabilidad civil de suscripción obligatoria',
      codigoRelacion: 'MOCK'
    },
    {
      codigo: 'RC2',
      descripcion: 'Responsabilidad civil voluntaria',
      codigoRelacion: 'MOCK'
    },
    {
      codigo: 'AC1',
      descripcion: 'Accidentes corporales',
      codigoRelacion: 'MOCK'
    },
    {
      codigo: 'SPJ',
      descripcion: 'Seguro de protección jurídica',
      codigoRelacion: 'MOCK'
    },
  ]

  coberturasOpcionalesMock: Cobertura[] = [
    {
      codigo: 'ASIST',
      descripcion: 'Asistencia en viaje',
      contratada: false,
      codigoRelacion: 'MOCK'
    },
    {
      codigo: 'ATM',
      descripcion: 'Fenómenos atmosféricos',
      contratada: false,
      codigoRelacion: 'MOCK'
    },
    {
      codigo: 'ACC_COND',
      descripcion: 'Accidentes del conductor',
      contratada: false,
      codigoRelacion: 'MOCK'
    },
    {
      codigo: 'COL_ANI',
      descripcion: 'Daños por colisión con animal',
      contratada: false,
      codigoRelacion: 'MOCK'
    }
  ]

  modalidadesMock: Modalidad[] = [
    {
      codigo: 'TERCERO_BASICO',
      descripcion: 'Tercero básico',
      orden: '1',
      agrupacion: {
        codigo: "TERCEROS",
        descripcion: "Terceros",
        codigoRelacion: "TERCEROS_BASICO"
      },
      primaTotal: 63.00,
      primerRecibo: 63.00,
      restoRecibos: 0,
      franquicia: null,
      coberturasIncluidas: this.coberturasIncluidasMock,
      coberturasOpcionales: structuredClone(this.coberturasOpcionalesMock),
      derogacion: false
    },
    {
      codigo: 'TERCERO_BASICO_LUNA',
      descripcion: 'Tercero básico + luna',
      orden: '2',
      agrupacion: {
        codigo: "TERCEROS",
        descripcion: "Terceros",
        codigoRelacion: "TERCERO_BASICO_LUNA"
      },
      primaTotal: 70.00,
      primerRecibo: 70.00,
      restoRecibos: 0,
      franquicia: null,
      coberturasIncluidas: this.coberturasIncluidasMock,
      coberturasOpcionales: structuredClone(this.coberturasOpcionalesMock),
      derogacion: false,
    },
    {
      codigo: 'TERCEROS_LUNAS_CXC',
      descripcion: 'Terceros + Lunas + CxC',
      orden: '3',
      agrupacion: {
        codigo: "TERCEROS_AUMENTADO",
        descripcion: "Terceros aumentado",
        codigoRelacion: "TERCEROS_LUNAS_CXC"
      },
      primaTotal: 180.00,
      primerRecibo: 180.00,
      restoRecibos: 0,
      franquicia: null,
      coberturasIncluidas: this.coberturasIncluidasMock,
      coberturasOpcionales: structuredClone(this.coberturasOpcionalesMock),
      derogacion: false
    },
    {
      codigo: 'TERCEROS_LUNAS_ROBO',
      descripcion: 'Terceros + Lunas + Robo',
      orden: '4',
      agrupacion: {
        codigo: "TERCEROS_AUMENTADO",
        descripcion: "Terceros aumentado",
        codigoRelacion: "TERCEROS_LUNAS_ROBO"
      },
      primaTotal: 0,
      primerRecibo: 0,
      restoRecibos: 0,
      franquicia: null,
      coberturasIncluidas: this.coberturasIncluidasMock,
      coberturasOpcionales: structuredClone(this.coberturasOpcionalesMock),
      derogacion: true
    },
    {
      codigo: 'RIESGO_300',
      descripcion: 'Riesgo con franquicia',
      orden: '5',
      agrupacion: {
        codigo: "TODO_RIESGO",
        descripcion: "A todo riesgo",
        codigoRelacion: "RIESGO_300"
      },
      primaTotal: 270.00,
      primerRecibo: 270.00,
      restoRecibos: 0,
      franquicia: 300,
      coberturasIncluidas: this.coberturasIncluidasMock,
      coberturasOpcionales: structuredClone(this.coberturasOpcionalesMock),
      derogacion: false
    },
    {
      codigo: 'RIESGO_600',
      descripcion: 'Riesgo con franquicia',
      orden: '5',
      agrupacion: {
        codigo: "TODO_RIESGO",
        descripcion: "A todo riesgo",
        codigoRelacion: "RIESGO_600"
      },
      primaTotal: 220.00,
      primerRecibo: 220.00,
      restoRecibos: 0,
      franquicia: 600,
      coberturasIncluidas: this.coberturasIncluidasMock,
      coberturasOpcionales: structuredClone(this.coberturasOpcionalesMock),
      derogacion: false
    },
    {
      codigo: 'RIESGO_900',
      descripcion: 'Riesgo con franquicia',
      orden: '5',
      agrupacion: {
        codigo: "TODO_RIESGO",
        descripcion: "A todo riesgo",
        codigoRelacion: "RIESGO_900"
      },
      primaTotal: 190.00,
      primerRecibo: 190.00,
      restoRecibos: 0,
      franquicia: 900,
      coberturasIncluidas: this.coberturasIncluidasMock,
      coberturasOpcionales: structuredClone(this.coberturasOpcionalesMock),
      derogacion: false
    },
    {
      codigo: 'RIESGO_0',
      descripcion: 'Riesgo sin franquicia',
      orden: '6',
      agrupacion: {
        codigo: "TODO_RIESGO",
        descripcion: "A todo riesgo",
        codigoRelacion: "RIESGO_0"
      },
      primaTotal: 300.00,
      primerRecibo: 300.00,
      restoRecibos: 0,
      franquicia: 0,
      coberturasIncluidas: this.coberturasIncluidasMock,
      coberturasOpcionales: structuredClone(this.coberturasOpcionalesMock),
      derogacion: false
    }
  ];
  //#endregion MOCKS

  readonly modalidades = signal<Modalidad[]>(this.modalidadesMock);

  readonly modalidadesAgrupadas = computed(() =>
    this.agruparModalidades(this.modalidades())
  );

  /**
   * Inicializa el estado de la página desde sesión si existe.
   * Si no existe, se inicializa con los valores por defecto.
   */
  private inicializarEstadoPagina(): void {
    const estadoSesion = this.stateService.restaurarEstado();

    if (estadoSesion) {
      this.modalidades.set(estadoSesion.modalidades);
      return;
    }

    this.modalidades.set(this.modalidadesMock);
  }

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
   * Procesa el recalculo solicitado desde un grupo de modalidades.
   *
   * Actualiza el listado completo de modalidades, marca la modalidad recalculada
   * como referencia visual si corresponde y persiste toda la información de la página en sesión.
   *
   * @param event Evento emitido por el componente hijo con la modalidad actualizada.
   */
  onRecalcularModalidad(event: RecalcularModalidadEvent): void {
    const modalidadRecalculada = event.modalidadActualizada; // Por ahora se toma directamente del evento al no tener consulta a backend.

    const modalidadesActualizadas = this.reemplazarModalidadRecalculada(
      this.modalidades(),
      modalidadRecalculada,
      event.codigoGrupo
    );

    this.modalidades.set(modalidadesActualizadas);
    this.persistirEstadoPagina(modalidadesActualizadas);
  }

  /**
   * Reemplaza la modalidad recalculada dentro del listado completo.
   *
   * Si la modalidad pertenece al grupo TODO_RIESGO y contiene franquicia, también
   * actualiza la referencia visual de franquicia, dejando marcada como seleccionada
   * únicamente la modalidad recalculada.
   *
   * @param modalidades Listado completo de modalidades actual.
   * @param modalidadRecalculada Modalidad devuelta por backend tras el recalculo.
   * @param codigoGrupo Código del grupo desde el cual se solicitó el recalculo.
   * @returns Nuevo listado de modalidades actualizado.
   */
  private reemplazarModalidadRecalculada(
    modalidades: Modalidad[],
    modalidadRecalculada: Modalidad,
    codigoGrupo: string
  ): Modalidad[] {
    const esGrupoTodoRiesgo = codigoGrupo === "TODO_RIESGO";
    const esModalidadConFranquicia =
      modalidadRecalculada.franquicia !== null &&
      modalidadRecalculada.franquicia !== 0;

    return modalidades.map(modalidad => {
      const perteneceAlMismoGrupo =
        modalidad.agrupacion.codigo === codigoGrupo;

      const esLaModalidadRecalculada =
        modalidad.codigo === modalidadRecalculada.codigo;

      if (!perteneceAlMismoGrupo) {
        return modalidad;
      }

      if (esGrupoTodoRiesgo && esModalidadConFranquicia) {
        if (esLaModalidadRecalculada) {
          return {
            ...modalidadRecalculada,
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
      }

      if (esLaModalidadRecalculada) {
        return modalidadRecalculada;
      }

      return modalidad;
    });
  }

  /**
   * Persiste en sesión el estado completo de la página únicamente después de aplicar y recalcular correctamente
   *
   * @param modalidades Listado de modalidades a persistir.
   */
  private persistirEstadoPagina(modalidades: Modalidad[]): void {
    this.stateService.guardarEstado({
      modalidades
    });
  }

}
