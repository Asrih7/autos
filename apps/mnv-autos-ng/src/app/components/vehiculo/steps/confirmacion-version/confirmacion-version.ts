import { Component, computed, input, signal, inject, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Version } from "../../models/vehiculo.models"; 
import {
  BalHeading,
  BalBadge,
  BalSelect,
  BalSelectOption,
  BalField,
  BalFieldControl,
  BalInput,
  BalRadioGroup,
  BalRadio,
  BalTag,
  BalIcon,
  BalButton,
  parseCustomEvent,
  BalRadioIcon,
} from "@baloise/ds-angular";
import { VehiculoStateService } from "../../services/vehiculo-state.service";
import { TranslateModule, TranslateService } from "@ngx-translate/core";

export interface FilterDropdownOption {
  label: string;
  value: string;
}

@Component({
  selector: "app-confirmacion-version",
  standalone: true,
  imports: [
    FormsModule,
    BalHeading,
    BalBadge,
    BalSelect,
    BalSelectOption,
    BalField,
    BalFieldControl,
    BalInput,
    BalRadioGroup,
    BalRadio,
    BalRadioIcon,
    BalTag,
    BalIcon,
    BalButton,
    TranslateModule,
  ],
  templateUrl: "./confirmacion-version.html",
  styleUrl: "./confirmacion-version.scss",
})
export class ConfirmacionVersion implements OnInit {
  readonly onStepComplete = input<(stepOutputData: unknown) => void>();

  private readonly stateService = inject(VehiculoStateService);
  private readonly translate = inject(TranslateService);
  
  readonly nombreVehiculoCompleto = this.stateService.nombreVehiculoCompleto;

  readonly listaVersiones = computed<Version[]>(() => [
    { id: "v1", nombre: "SUMMUM 7PZ", combustible: "Diesel", cilindrada: "2400", potencia: "185 cv", puertas: "5 puertas", inicioFabricacion: "04/2009" },
    { id: "v2", nombre: "SUMMUM AUTO 7PZ", combustible: "Diesel", cilindrada: "2400", potencia: "185 cv", puertas: "5 puertas", inicioFabricacion: "04/2009" },
    { id: "v3", nombre: "R-DESIGN 7PZ", combustible: "Diesel", cilindrada: "2400", potencia: "185 cv", puertas: "5 puertas", inicioFabricacion: "04/2009" },
    { id: "v4", nombre: "MOMENTUM 7PZ", combustible: "Diesel", cilindrada: "2400", potencia: "185 cv", puertas: "5 puertas", inicioFabricacion: "04/2009" },
    { id: "v5", nombre: "SUMMUM 7PZ", combustible: "Diesel", cilindrada: "2400", potencia: "185 cv", puertas: "5 puertas", inicioFabricacion: "04/2009" },
    { 
      id: "v6", 
      nombre: this.translate.instant('vehiculo.confirmacionVersion.list.noneOfThese'), 
      combustible: "", 
      cilindrada: "", 
      potencia: "", 
      puertas: "", 
      inicioFabricacion: "" 
    },
  ]);

  readonly versionSeleccionadaId = signal<string | null>(null);

  readonly idSeleccionadaVista = computed<string>(() => {
    return this.versionSeleccionadaId() || this.listaVersiones()[0].id;
  });

  readonly filtroGlobal = signal<string>("");
  readonly filtroPuertas = signal<string | null>(null);
  readonly filtroCilindrada = signal<string | null>(null);
  readonly filtroPotencia = signal<string | null>(null);
  readonly filtroCombustible = signal<string | null>(null);

  ngOnInit(): void {
    const cachedVehicle = this.stateService.state().vehiculoData;
    if (cachedVehicle?.version?.id) {
      this.versionSeleccionadaId.set(cachedVehicle.version.id);
    }
  }

  readonly versionesFiltradas = computed<Version[]>(() => {
    let resultado = this.listaVersiones();

    const busqueda = this.filtroGlobal().toLowerCase().trim();
    if (busqueda) {
      resultado = resultado.filter(
        (v) =>
          v.nombre.toLowerCase().includes(busqueda) ||
          v.puertas.toLowerCase().includes(busqueda) ||
          v.combustible.toLowerCase().includes(busqueda) ||
          v.cilindrada.toLowerCase().includes(busqueda) ||
          v.potencia.toLowerCase().includes(busqueda),
      );
    }

    const puertas = this.filtroPuertas();
    if (puertas) resultado = resultado.filter((v) => v.puertas === puertas);

    const cilin = this.filtroCilindrada();
    if (cilin) resultado = resultado.filter((v) => v.cilindrada === cilin);

    const comb = this.filtroCombustible();
    if (comb) resultado = resultado.filter((v) => v.combustible === comb);

    const pot = this.filtroPotencia();
    if (pot) resultado = resultado.filter((v) => v.potencia === pot);

    return resultado;
  });

  readonly objetoVersionSeleccionada = computed<Version | null>(() => {
    const id = this.versionSeleccionadaId();
    if (!id) return null;
    return this.listaVersiones().find((v) => v.id === id) || null;
  });

  readonly botonDeshabilitado = computed<boolean>(
    () => !this.versionSeleccionadaId(),
  );

  readonly opcionesPuertas = computed(() => this.mapearOpcionesUnique("puertas"));
  readonly opcionesCilindrada = computed(() => this.mapearOpcionesUnique("cilindrada"));
  readonly opcionesPotencia = computed(() => this.mapearOpcionesUnique("potencia"));
  readonly opcionesCombustible = computed(() => this.mapearOpcionesUnique("combustible"));

  private mapearOpcionesUnique(propiedad: keyof Version): FilterDropdownOption[] {
    const valoresValidos = this.listaVersiones()
      .map((v) => v[propiedad])
      .filter((valor): valor is string => typeof valor === "string" && valor.trim().length > 0);

    const unicos = Array.from(new Set(valoresValidos));
    return unicos.map((val) => ({ label: val, value: val }));
  }

  confirmarVersion(): void {
    if (!this.botonDeshabilitado()) {
      const versionElegida = this.objetoVersionSeleccionada();
      
      if (versionElegida) {
        this.stateService.saveVersionSeleccionada(versionElegida);
      }

      const callback = this.onStepComplete();
      if (callback) {
        callback({ status: "VERSION_CONFIRMED" });
      }
    }
  }

  onFiltroChanged(tipo: "puertas" | "cilindrada" | "potencia" | "combustible", event: Event): void {
    const parsedEvent = parseCustomEvent(event);
    if (!parsedEvent) return;

    const value = Array.isArray(parsedEvent) ? parsedEvent[0] : parsedEvent;
    
    const validatedValue = typeof value === "string" && value.trim().length > 0 && value !== "RESET_CLEAR" 
      ? value 
      : null;

    switch (tipo) {
      case "puertas": this.filtroPuertas.set(validatedValue); break;
      case "cilindrada": this.filtroCilindrada.set(validatedValue); break;
      case "potencia": this.filtroPotencia.set(validatedValue); break;
      case "combustible": this.filtroCombustible.set(validatedValue); break;
    }
  }

  onSearchInput(event: Event): void {
    const parsedEvent = parseCustomEvent(event);
    
    const query = typeof parsedEvent === "string" ? parsedEvent : "";
    this.filtroGlobal.set(query);
  }

  onTileSelected(versionId: string): void {
    if (!versionId) return;
    this.versionSeleccionadaId.set(versionId);
  }
}