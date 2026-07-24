import {
  Component,
  computed,
  effect,
  inject,
  input,
  OnInit,
  signal,
  untracked,
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
  BalSpinner,
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
  standalone: true,
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
    BalSegmentItem,
    BalSpinner
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

  readonly cargandoAccesorios = this.stateService.loadingAccesorios;
  readonly listaAccesoriosCompleta = signal<AccesoriosAdicionales[]>([]);

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

  constructor() {
    effect(() => {
      const masterCatalog = this.stateService.accesoriosRaw();
      
      if (masterCatalog.length > 0) {
        untracked(() => {
          const cachedState = this.stateService.state().vehiculoData;
          const savedIds = new Set(cachedState?.accesoriosAdicionales?.map(i => i.idAccesorio) ?? []);

          this.listaAccesoriosCompleta.set(
            masterCatalog.map(item => ({
              ...item,
              checked: savedIds.has(item.idAccesorio)
            }))
          );
        });
      }
    });
  }

  ngOnInit(): void {
    const cachedState = this.stateService.state().vehiculoData;
    
    if (cachedState?.version?.id) {
      this.stateService.loadAccesoriosCatalog(cachedState.version.id);
    }

    if (cachedState && cachedState.tieneAccesoriosSeries !== undefined) {
      this.tieneAccesoriosSeries.set(cachedState.tieneAccesoriosSeries);
    }
  }

  onRadioGroupChange(event: Event): void {
    const parsed = parseCustomEvent(event);
    if (typeof parsed === 'string') {
      this.cambiarModoAccesorios(parsed === "serie");
    }
  }

  onSegmentChange(event: Event): void {
    const parsed = parseCustomEvent(event);
    if (typeof parsed === 'string') {
      this.tipoSelectorAccesorios.set(parsed as "genericos" | "fabricante");
    }
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
