import {
  Component,
  effect,
  signal,
  viewChild,
  inject,
  OnInit,
  untracked,
  input,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
  BalHeading,
  BalButton,
  BalField,
  BalFieldControl,
  BalSelect,
  BalSelectOption,
  parseCustomEvent,
} from "@baloise/ds-angular";
import { DataGridSelector } from "@mnv-autos-ng/ui";
import { VehiculoStateService } from "../../services/vehiculo-state.service";
import { TranslateModule } from "@ngx-translate/core";
import { useIsMobile } from "@mnv-autos-ng/util";

@Component({
  selector: "app-busqueda-manual",
  standalone: true,
  imports: [
    FormsModule,
    BalHeading,
    BalButton,
    BalField,
    BalFieldControl,
    BalSelect,
    BalSelectOption,
    DataGridSelector,
    TranslateModule,
  ],
  templateUrl: "./busqueda-manual.component.html",
  styleUrl: "./busqueda-manual.component.scss",
})
export class BusquedaManualComponent implements OnInit {
  protected readonly stateService = inject(VehiculoStateService);
  readonly onStepComplete = input<(stepOutputData: unknown) => void>();
  readonly stepId = input<string>();
  readonly selectModelo = viewChild<BalSelect>("selectComponent");
  readonly baseLangKey = "vehiculo.busquedaManual";
  readonly esMobile = useIsMobile();

  readonly marcaSeleccionadaId = signal<string | null>(null);
  readonly modeloSeleccionadoId = signal<string | null>(null);
  readonly mostrarModelos = signal<boolean>(false);

  constructor() {
    effect(() => {
      const state = this.stateService.state();
      const vehiculo = state.vehiculoData;

      if (vehiculo?.marca?.id) {
        untracked(() => {
          this.marcaSeleccionadaId.set(vehiculo.marca?.id ?? null);
          this.mostrarModelos.set(true);

          if (vehiculo?.modelo?.id) {
            this.modeloSeleccionadoId.set(vehiculo.modelo?.id ?? null);
          } else {
            this.modeloSeleccionadoId.set(null);
          }
        });
      } else {
        untracked(() => {
          this.marcaSeleccionadaId.set(null);
          this.modeloSeleccionadoId.set(null);
          this.mostrarModelos.set(false);
        });
      }
    });

    effect(() => {
      if (this.stateService.busquedaExitosa()) {
        untracked(() => {
          const callback = this.onStepComplete();
          if (callback) {
            callback({
              status: "REGISTRATION_LOOKUP_COMPLETE",
              source: "API_SEARCH",
            });
          }
          this.stateService.clearBusquedaExitosa();
        });
      }
    });
  }

  ngOnInit(): void {
    this.stateService.loadMarcasCatalog();
    const state = this.stateService.state();
    const vehiculo = state.vehiculoData;

    if (vehiculo?.marca?.id) {
      this.marcaSeleccionadaId.set(vehiculo.marca.id);
      this.mostrarModelos.set(true);
      
      this.stateService.loadModelosCatalog(vehiculo.marca.id);

      if (vehiculo?.modelo?.id) {
        this.modeloSeleccionadoId.set(vehiculo.modelo.id);
      }
    }
  }

  confirmarMarca(): void {
    const brandId = this.marcaSeleccionadaId();
    if (!brandId) return;

    const brandObject = this.stateService
      .marcas()
      .find((m) => m.id === brandId);
    if (brandObject) {
      this.stateService.saveMarca(brandObject);
    }
    this.stateService.loadModelosCatalog(brandId);
    this.mostrarModelos.set(true);
  }

  onModeloChanged(event: Event): void {
    const parsedEvent = parseCustomEvent(event);
    if (!parsedEvent) return;

    const value = Array.isArray(parsedEvent) ? parsedEvent : parsedEvent;
    const validatedValue =
      typeof value === "string" && value.trim().length > 0 ? value : null;

    this.modeloSeleccionadoId.set(validatedValue);
  }

  confirmarModelo(): void {
    const modeloId = this.modeloSeleccionadoId();
    if (modeloId !== null) {
      const modelObject = this.stateService
        .modelos()
        .find((m) => m.id === modeloId);
      if (modelObject) {
        this.stateService.saveModelo(modelObject);
      }

      const callback = this.onStepComplete();
      if (callback) {
        callback({ status: "MANUAL_SELECTION_COMPLETE" });
      }
    }
  }
}
