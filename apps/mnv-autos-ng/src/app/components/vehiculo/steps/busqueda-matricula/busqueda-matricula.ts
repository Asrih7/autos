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
  BalField,
  BalFieldControl,
  BalHeading,
  BalInput,
  BalSegment,
  BalSegmentItem,
  parseCustomEvent,
  BalFieldMessage,
} from "@baloise/ds-angular";
import { TranslateModule } from "@ngx-translate/core";
import { StepCompleteCallback } from "../../vehiculo";
import { VehiculoStateService } from "../../services/vehiculo-state.service";
import { useIsMobile } from '@mnv-autos-ng/util';
import { MetodoBusqueda } from "../../models/vehiculo.models";

@Component({
  selector: "app-busqueda-matricula",
  standalone: true,
  imports: [
    BalHeading,
    BalSegment,
    BalSegmentItem,
    BalField,
    BalButton,
    BalInput,
    BalFieldControl,
    BalFieldMessage,
    TranslateModule
  ],
  templateUrl: "./busqueda-matricula.html",
  styleUrl: "./busqueda-matricula.scss",
})
export class BusquedaMatricula implements OnInit {
  readonly onStepComplete = input<StepCompleteCallback>();
  protected readonly stateService = inject(VehiculoStateService);

  readonly esMobile = useIsMobile();
  readonly opcionSeleccionada = signal<MetodoBusqueda>("matricula");
  readonly textoBusqueda = signal<string>("");

  readonly estaCargando = this.stateService.loading; 
  readonly errorApi = this.stateService.error;

  private readonly baseLangKey = "vehiculo.busquedaMatricula";

  constructor() {
    effect(() => {
      if (this.stateService.busquedaExitosa()) {
        
        untracked(() => {
          const callback = this.onStepComplete();
          if (callback) {
            callback({ status: "REGISTRATION_LOOKUP_COMPLETE" });
          }
          this.stateService.clearBusquedaExitosa();
        });
        
      }
    });
  }

  ngOnInit(): void {
    const savedState = this.stateService.state();
    if (savedState.metodoBusqueda) {
      this.opcionSeleccionada.set(savedState.metodoBusqueda);
    }
    
    if (savedState.matriculaOBastidor) {
      const visibleText = savedState.matriculaOBastidor === "MANUAL_SEARCH_ACTIVE" 
        ? "" 
        : savedState.matriculaOBastidor;
        
      this.textoBusqueda.set(visibleText);
    }
  }

  readonly patronDinamico = computed(() =>
    this.opcionSeleccionada() === "matricula"
      ? "^[0-9]{4}[BCDFGHJKLMNPRSTVWXYZ]{3}$"
      : "^[A-Z0-9]{17}$",
  );

  readonly placeholderDinamico = computed(() =>
    this.opcionSeleccionada() === "matricula"
      ? `${this.baseLangKey}.placeholders.matricula`
      : `${this.baseLangKey}.placeholders.bastidor`,
  );

  readonly esTextoValido = computed(() => {
    const texto = this.textoBusqueda().trim();
    if (!texto) return false;

    const regex = new RegExp(this.patronDinamico());
    return regex.test(texto);
  });

  readonly esInvalido = computed(
    () => this.textoBusqueda().trim().length > 0 && !this.esTextoValido(),
  );

  readonly botonDeshabilitado = computed(() => !this.esTextoValido() || this.estaCargando());

  readonly mensajeErrorDinamico = computed(() =>
    this.opcionSeleccionada() === "matricula"
      ? `${this.baseLangKey}.errors.matricula`
      : `${this.baseLangKey}.errors.bastidor`,
  );

  alCambiarOpcion(event: Event): void {
    const parsedEvent = parseCustomEvent(event);
    if (!parsedEvent) return;

    const valorSeleccionado = parsedEvent as MetodoBusqueda;

    this.opcionSeleccionada.set(valorSeleccionado);
    this.textoBusqueda.set("");
  }

  onInputUpdate(event: Event): void {
    const parsedEvent = parseCustomEvent(event);
    if (!parsedEvent) return;

    const customEvent = parsedEvent as string | undefined;
    this.textoBusqueda.set((customEvent ?? "").toUpperCase());
  }

  alBuscar(): void {
    if (!this.botonDeshabilitado()) {
      this.stateService.buscarVehiculoPorApi(
        this.opcionSeleccionada(), 
        this.textoBusqueda().trim()
      );
    }
  }

  activarBusquedaManual(): void {
    const metodo = this.opcionSeleccionada();
    const valor = this.textoBusqueda().trim() || "MANUAL_SEARCH_ACTIVE";

    this.stateService.saveMatriculaOBastidor(metodo, valor);

    const callback = this.onStepComplete();
    if (callback) {
      callback({ accion: "FORZAR_BUSQUEDA_MANUAL" });
    }
  }
}
