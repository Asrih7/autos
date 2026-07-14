import {
  Component,
  computed,
  effect,
  signal,
  viewChild,
  inject,
  input,
  OnInit,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Marca, Modelo, Vehiculo } from "../../models/vehiculo.models";
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
  templateUrl: "./busqueda-manual.html",
  styleUrl: "./busqueda-manual.scss",
})
export class BusquedaManualComponent implements OnInit {
  private readonly stateService = inject(VehiculoStateService);
  readonly onStepComplete = input<(stepOutputData: unknown) => void>();
  readonly selectModelo = viewChild<BalSelect>("selectComponent");
  readonly baseLangKey = "vehiculo.busquedaManual";

  readonly catalogoMarcas = signal<Marca[]>([
    { id: "aud", nombre: "Audi", logo: "assets/logos/audi.png" },
    { id: "dac", nombre: "Dacia", logo: "assets/logos/dacia.png" },
    { id: "fia", nombre: "Fiat", logo: "assets/logos/fiat.png" },
    { id: "hyu", nombre: "Hyundai", logo: "assets/logos/hyundai.png" },
    { id: "kia", nombre: "Kia", logo: "assets/logos/kia.png" },
    { id: "nis", nombre: "Nissan", logo: "assets/logos/nissan.png" },
    { id: "jee", nombre: "Jeep", logo: "assets/logos/jeep.png" },
    { id: "for", nombre: "Ford", logo: "assets/logos/ford.png" },
  ]);

  readonly listaModelos = signal<Modelo[]>([
    { id: "golf", nombre: "Golf" },
    { id: "polo", nombre: "Polo" },
    { id: "passat", nombre: "Passat" },
  ]);

  readonly marcaSeleccionadaId = signal<string | null>(null);
  readonly modeloSeleccionadoId = signal<string | null>(null);
  readonly mostrarModelos = signal<boolean>(false);

  private isInitializing = false;

  constructor() {
    effect(() => {
      const brandId = this.marcaSeleccionadaId();

      if (brandId) {
        if (!this.isInitializing) {
          this.modeloSeleccionadoId.set(null);
        }
        
        setTimeout(() => void this.selectModelo()?.setFocus(), 60);
      }
    });
  }

  ngOnInit(): void {
    this.isInitializing = true;

    const currentSummary = this.stateService.selectedBrandAndModel();

    if (currentSummary.marca?.id) {
      this.marcaSeleccionadaId.set(currentSummary.marca.id);
      
      if (currentSummary.modelo?.id) {
        this.modeloSeleccionadoId.set(currentSummary.modelo.id);
        this.mostrarModelos.set(true); // Expand fields view block automatically
      }
    }

    setTimeout(() => {
      this.isInitializing = false;
    }, 0);
  }

  readonly marcaModeloSelecionado = computed<Pick<Vehiculo, "marca" | "modelo">>(() => {
    const marcaEncontrada = this.catalogoMarcas().find((m) => this.marcaSeleccionadaId() === m.id);
    const modeloEncontrado = this.listaModelos().find((m) => this.modeloSeleccionadoId() === m.id);

    return {
      marca: marcaEncontrada ? marcaEncontrada : { id: "", nombre: '', logo: '' },
      modelo: modeloEncontrado ? modeloEncontrado : { id: "", nombre: "" },
    };
  });

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
    if (this.modeloSeleccionadoId() !== null) {
      const modelObject = this.listaModelos().find(m => m.id === this.modeloSeleccionadoId());
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
