import {
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from "@angular/core";
import {
  BalButton,
  BalCheck,
  BalCheckbox,
  BalCheckboxGroup,
  BalContent,
  BalField,
  BalFieldControl,
  BalInput,
  BalLabel,
  BalRadio,
  BalRadioGroup,
  BalRadioIcon,
  BalSegment,
  BalSegmentItem,
  BalStack,
  parseCustomEvent,
} from "@baloise/ds-angular";
import {
  AccesoriosAdicionales,
  GroupedAccesorios,
} from "../../models/vehiculo.models";
import { VehiculoStateService } from "../../services/vehiculo-state.service";
import { FormsModule } from "@angular/forms";
import { TranslateModule } from "@ngx-translate/core";
import { useIsMobile } from '@mnv-autos-ng/util';

@Component({
  selector: "app-accesorios",
  imports: [
    FormsModule,
    TranslateModule,
    BalButton,
    BalField,
    BalFieldControl,
    BalInput,
    BalRadioGroup,
    BalRadio,
    BalCheckboxGroup,
    BalCheckbox,
    BalCheck,
    BalStack,
    BalContent,
    BalLabel,
    BalRadioIcon,
    BalSegment,
    BalSegmentItem
  ],
  templateUrl: "./accesorios.html",
  styleUrl: "./accesorios.scss",
})
export class Accesorios implements OnInit {
  readonly onStepComplete = input<(stepOutputData: unknown) => void>();
  private readonly stateService = inject(VehiculoStateService);

  readonly esMobile = useIsMobile();
  readonly tieneAccesoriosSeries = signal<boolean>(true);
  readonly tipoSelectorAccesorios = signal<"genericos" | "fabricante">("genericos");
  readonly filtroBusqueda = signal<string>("");

  readonly listaAccesoriosCompleta = signal<AccesoriosAdicionales[]>([
    { checked: false, idAccesorio: 101, idModeloVehiculo: 99, codigoAccesorio: "ACC01", anyoAccesorio: "2024", mesAccesorio: 1, importeAccesorio: 234, descripcionAccesorio: "Alarma", tipoAccesorio: "Seguridad" },
    { checked: false, idAccesorio: 102, idModeloVehiculo: 99, codigoAccesorio: "ACC02", anyoAccesorio: "2024", mesAccesorio: 1, importeAccesorio: 500, descripcionAccesorio: "Alarma antirrobo hasta 400 €", tipoAccesorio: "Seguridad" },
    { checked: false, idAccesorio: 103, idModeloVehiculo: 99, codigoAccesorio: "ACC03", anyoAccesorio: "2024", mesAccesorio: 1, importeAccesorio: 781, descripcionAccesorio: "Arranque codificado", tipoAccesorio: "Seguridad" },
    { checked: false, idAccesorio: 201, idModeloVehiculo: 99, codigoAccesorio: "ACC04", anyoAccesorio: "2024", mesAccesorio: 1, importeAccesorio: 312, descripcionAccesorio: "Cierre centralizado", tipoAccesorio: "Sonido y multimedia" },
    { checked: false, idAccesorio: 301, idModeloVehiculo: 99, codigoAccesorio: "FAC01", anyoAccesorio: "2024", mesAccesorio: 1, importeAccesorio: 1200, descripcionAccesorio: "Navegador Satélite Oficial", tipoAccesorio: "Fabricante" }
  ]);

  readonly arrayIdsSeleccionados = computed<number[]>(() => {
    return this.listaAccesoriosCompleta()
      .filter(item => item.checked)
      .map(item => item.idAccesorio);
  });

  readonly listaAccesoriosFiltrados = computed<GroupedAccesorios[]>(() => {
    const query = this.filtroBusqueda().toLowerCase().trim();
    const activeSegment = this.tipoSelectorAccesorios();

    const itemsPorOrigen = this.listaAccesoriosCompleta().filter(item => {
      const esFabricante = item.tipoAccesorio === "Fabricante";
      return activeSegment === "fabricante" ? esFabricante : !esFabricante;
    });

    const itemsFiltrados = query 
      ? itemsPorOrigen.filter(item => item.descripcionAccesorio.toLowerCase().includes(query))
      : itemsPorOrigen;

    if (itemsFiltrados.length === 0) return [];

    const gruposMap = new Map<string, AccesoriosAdicionales[]>();
    itemsFiltrados.forEach(item => {
      const nombreGrupo = item.tipoAccesorio === "Fabricante" ? "Accesorios del Fabricante" : item.tipoAccesorio;
      if (!gruposMap.has(nombreGrupo)) gruposMap.set(nombreGrupo, []);
      gruposMap.get(nombreGrupo)?.push(item);
    });

    return Array.from(gruposMap.entries()).map(([nombreGrupo, items]) => ({ nombreGrupo, items }));
  });

  ngOnInit(): void {
    const cachedState = this.stateService.state().vehiculoData;
    if (cachedState) {
      if (cachedState.tieneAccesoriosSeries !== undefined) {
        this.tieneAccesoriosSeries.set(cachedState.tieneAccesoriosSeries);
      }
      
      if (cachedState.accesoriosAdicionales && cachedState.accesoriosAdicionales.length > 0) {
        const savedIds = new Set(cachedState.accesoriosAdicionales.map(i => i.idAccesorio));
        
        this.listaAccesoriosCompleta.update(items => 
          items.map(item => ({
            ...item,
            checked: savedIds.has(item.idAccesorio)
          }))
        );
      }
    }
  }

  onRadioGroupChange(event: CustomEvent<string>): void {
    this.cambiarModoAccesorios(event.detail === "serie");
  }

  onSegmentChange(event: CustomEvent<"genericos" | "fabricante">): void {
    this.tipoSelectorAccesorios.set(event.detail);
  }

  cambiarModoAccesorios(esDeSerie: boolean): void {
    this.tieneAccesoriosSeries.set(esDeSerie);
    if (esDeSerie) {
      this.listaAccesoriosCompleta.update(items => items.map(i => ({ ...i, checked: false })));
      this.filtroBusqueda.set("");
    }
  }

  onSearchInput(event: Event): void {
    const parsed = parseCustomEvent(event);
    this.filtroBusqueda.set(typeof parsed === "string" ? parsed : "");
  }

  toggleAccesorioSelection(targetItem: AccesoriosAdicionales): void {
    this.listaAccesoriosCompleta.update(items =>
      items.map(item => item.idAccesorio === targetItem.idAccesorio 
        ? { ...item, checked: !item.checked } 
        : item
      )
    );
  }

  private persistirEstadoGlobal(): void {
    const soloSeleccionados = this.listaAccesoriosCompleta().filter(item => item.checked);
    this.stateService.saveAccesoriosData(this.tieneAccesoriosSeries(), soloSeleccionados);
  }

  guardarYAvanzar(): void {
    this.persistirEstadoGlobal();
    this.dispararNavegacionSiguiente("ACCESORIOS_CONFIRMED");
  }

  saltarYNoDeclarar(): void {
    this.listaAccesoriosCompleta.update(items => items.map(i => ({ ...i, checked: false })));
    this.tieneAccesoriosSeries.set(true);
    this.persistirEstadoGlobal();
    this.dispararNavegacionSiguiente("ACCESORIOS_SKIPPED");
  }

  private dispararNavegacionSiguiente(statusLabel: string): void {
    const callback = this.onStepComplete();
    if (callback) callback({ status: statusLabel });
  }
}
