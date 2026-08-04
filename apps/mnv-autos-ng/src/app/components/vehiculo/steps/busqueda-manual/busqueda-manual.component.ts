import {
  Component,
  effect,
  signal,
  viewChild,
  inject,
  input,
  OnInit,
  untracked,
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
import { useIsMobile } from '@mnv-autos-ng/util';

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
    TranslateModule
  ],
  templateUrl: "./busqueda-manual.component.html",
  styleUrl: "./busqueda-manual.component.scss",
})
export class BusquedaManualComponent implements OnInit {
  private readonly stateService = inject(VehiculoStateService);
  readonly onStepComplete = input<(stepOutputData: unknown) => void>();
  readonly selectModelo = viewChild<BalSelect>("selectComponent");
  readonly baseLangKey = "vehiculo.busquedaManual";
  readonly esMobile = useIsMobile();

  readonly catalogoMarcas = this.stateService.marcas;
  readonly listaModelos = this.stateService.modelos;
  readonly cargandoModelos = this.stateService.loadingModelos;

  readonly marcaSeleccionadaId = signal<string | null>(null);
  readonly modeloSeleccionadoId = signal<string | null>(null);
  readonly mostrarModelos = signal<boolean>(false);

  private isInitializing = false;

  constructor() {
    effect(() => {
      const brandId = this.marcaSeleccionadaId();

      if (brandId) {
        untracked(() => {
          this.stateService.loadModelosCatalog(brandId);

          if (!this.isInitializing) {
            this.modeloSeleccionadoId.set(null);
          }
          
          setTimeout(() => void this.selectModelo()?.setFocus(), 100);
        });
      }
    });
  }

  ngOnInit(): void {
    this.isInitializing = true;
    
    this.stateService.loadMarcasCatalog();

    const currentSummary = this.stateService.selectedBrandAndModel();

    if (currentSummary.marca?.id) {
      this.marcaSeleccionadaId.set(currentSummary.marca.id);
      
      if (currentSummary.modelo?.id) {
        this.modeloSeleccionadoId.set(currentSummary.modelo.id);
        this.mostrarModelos.set(true); 
      }
    }

    setTimeout(() => {
      this.isInitializing = false;
    }, 0);
  }

  confirmarMarca(): void {
    const brandObject = this.catalogoMarcas().find(m => m.id === this.marcaSeleccionadaId());
    if (brandObject) {
      this.stateService.saveMarca(brandObject);
    }
    this.mostrarModelos.set(true);
  }

  onModeloChanged(event: Event): void {
    const parsedEvent = parseCustomEvent(event);
    if (!parsedEvent) return;

    const value = Array.isArray(parsedEvent) ? parsedEvent : parsedEvent;
    const validatedValue = typeof value === "string" && value.trim().length > 0 ? value : null;

    this.modeloSeleccionadoId.set(validatedValue);
  }

  confirmarModelo(): void {
    const modeloId = this.modeloSeleccionadoId();
    if (modeloId !== null) {
      const modelObject = this.listaModelos().find(m => m.id === modeloId);
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
