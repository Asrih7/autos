import { Component, computed, inject, OnDestroy, OnInit, signal } from "@angular/core";
import { PageNavigationService } from "@mnv-autos-ng/navigation";
import { GrupoModalidadesComponent } from "./steps/grupo-modalidades/grupo-modalidades.component";
import { Cobertura, GrupoModalidades, Modalidad } from "./models/modalidades.models";

@Component({
  selector: "app-precio-coberturas",
  standalone: true,
  imports: [GrupoModalidadesComponent],
  templateUrl: "./precio-coberturas.component.html",
  styleUrls: ["./precio-coberturas.component.scss"],
})
export class PrecioCoberturasComponent implements OnInit, OnDestroy {
  private readonly navService = inject(PageNavigationService);

  ngOnInit(): void {
    this.navService.activePageConfig.set({
      pageId: "precio-coberturas",
      previousPageUrl: "/uso-conductores",
      previousPageLabel: "Conductores",
      nextPageUrl: "/contratacion",
    });
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
      descripcion: 'Fernómenos atmosféricos',
      contratada: false,
      codigoRelacion: 'MOCK'
    },
    {
      codigo: 'ACC_COND',
      descripcion: 'Accidentes del conductor',
      contratada: true,
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
      coberturasOpcionales: this.coberturasOpcionalesMock,
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
      coberturasOpcionales: this.coberturasOpcionalesMock,
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
      coberturasOpcionales: this.coberturasOpcionalesMock,
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
      coberturasOpcionales: this.coberturasOpcionalesMock,
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
      franquicia: '300',
      coberturasIncluidas: this.coberturasIncluidasMock,
      coberturasOpcionales: this.coberturasOpcionalesMock,
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
      primaTotal: 270.00,
      primerRecibo: 270.00,
      restoRecibos: 0,
      franquicia: '0',
      coberturasIncluidas: this.coberturasIncluidasMock,
      coberturasOpcionales: this.coberturasOpcionalesMock,
      derogacion: false
    }
  ];
  //#endregion MOCKS

  readonly modalidades = signal<Modalidad[]>(this.modalidadesMock);
  readonly modalidadesAgrupadas = computed(() =>
    this.agruparModalidadesPorGrupo(this.modalidades())
  );

  /**
   * Agrupa las modalidades por código de agrupación y las ordena dentro de cada grupo por su campo `orden`.
   *
   * @param modalidades Listado de modalidades a procesar.
   * @returns Colección de grupos con sus modalidades ordenadas.
   */
  private agruparModalidadesPorGrupo(
    modalidades: Modalidad[]
  ): GrupoModalidades[] {

    return Object
      .values(
        modalidades.reduce(
          (acc, modalidad) => {
            const { agrupacion } = modalidad;

            if (!acc[agrupacion.codigo]) {
              acc[agrupacion.codigo] = {
                titulo: agrupacion.descripcion,
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

}
