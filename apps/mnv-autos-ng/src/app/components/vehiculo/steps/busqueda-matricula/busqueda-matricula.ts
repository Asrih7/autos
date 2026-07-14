import {
  Component,
  computed,
  inject,
  input,
  OnInit,
  OnDestroy,
  signal,
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
export class BusquedaMatricula implements OnInit, OnDestroy {
  readonly onStepComplete = input<StepCompleteCallback>();
  private readonly stateService = inject(VehiculoStateService);

  readonly opcionSeleccionada = signal<"matricula" | "bastidor">("matricula");
  readonly textoBusqueda = signal<string>("");

  private readonly baseLangKey = "vehiculo.busquedaMatricula";
  readonly esMobile = signal<boolean>(false);
  private mediaQueryList?: MediaQueryList;

  ngOnInit(): void {
    const savedState = this.stateService.state();
    if (savedState.metodoBusqueda) {
      this.opcionSeleccionada.set(savedState.metodoBusqueda);
    }
    if (savedState.matriculaOBastidor) {
      this.textoBusqueda.set(savedState.matriculaOBastidor);
    }

    if (typeof window !== 'undefined') {
      this.mediaQueryList = window.matchMedia('(max-width: 767px)');
      this.esMobile.set(this.mediaQueryList.matches);
      
      this.mediaQueryList.addEventListener('change', this.evaluarPantalla);
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

  readonly botonDeshabilitado = computed(() => !this.esTextoValido());

  readonly mensajeErrorDinamico = computed(() =>
    this.opcionSeleccionada() === "matricula"
      ? `${this.baseLangKey}.errors.matricula`
      : `${this.baseLangKey}.errors.bastidor`,
  );

  alCambiarOpcion(event: Event): void {
    const parsedEvent = parseCustomEvent(event);
    if (!parsedEvent) return;

    const valorSeleccionado = parsedEvent as "matricula" | "bastidor";

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
      const metodo = this.opcionSeleccionada();
      const valor = this.textoBusqueda().trim();

      this.stateService.saveMatriculaOBastidor(metodo, valor);

      const callback = this.onStepComplete();
      if (callback) {
        callback({ status: "REGISTRATION_LOOKUP_COMPLETE" });
      }
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

  ngOnDestroy(): void {
    this.mediaQueryList?.removeEventListener('change', this.evaluarPantalla);
  }

  private readonly evaluarPantalla = (e: MediaQueryListEvent) => {
    this.esMobile.set(e.matches);
  };
}
