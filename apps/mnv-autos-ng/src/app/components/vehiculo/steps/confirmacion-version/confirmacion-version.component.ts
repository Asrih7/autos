import { Component, computed, input, signal, inject, OnInit, effect, untracked } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { VersionVehiculo } from "../../models/vehiculo.models"; 
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
  BalSpinner,
  BalPagination,
} from "@baloise/ds-angular";
import { VehiculoStateService } from "../../services/vehiculo-state.service";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { useIsMobile } from '@mnv-autos-ng/util';

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
    BalPagination,
    TranslateModule,
    BalSpinner
  ],
  templateUrl: "./confirmacion-version.component.html",
  styleUrl: "./confirmacion-version.component.scss",
})
export class ConfirmacionVersion implements OnInit {
  readonly onStepComplete = input<(stepOutputData: unknown) => void>();
readonly currentPage = signal(1);
  readonly pageSize = signal<number>(10);
readonly opcionesPageSize: FilterDropdownOption[] = [
  { label: '10', value: '10' },
  { label: '20', value: '20' },
  { label: '30', value: '30' },
  { label: '50', value: '50' },
];

readonly versionesPaginadas = computed(() => {
  const lista = this.versionesFiltradas();
  const size = this.pageSize();
  const total = Math.ceil(lista.length / size);
  const page = Math.min(this.currentPage(), total || 1);
  const start = (page - 1) * size;
  return lista.slice(start, start + size);
});

readonly totalPages = computed(() => {
  const total = Math.ceil(this.versionesFiltradas().length / this.pageSize());
  return total > 0 ? total : 1;
});


  private readonly stateService = inject(VehiculoStateService);
  private readonly translate = inject(TranslateService);
  
  readonly esMobile = useIsMobile();
  readonly nombreVehiculoCompleto = this.stateService.nombreVehiculoCompleto;
  readonly cargandoVersiones = this.stateService.loadingVersiones;

  readonly listaVersiones = computed<VersionVehiculo[]>(() => {
  return this.stateService.versionesRaw();
});


  readonly versionSeleccionadaId = signal<string | null>(null);

  readonly idSeleccionadaVista = computed<string>(() => {
    return this.versionSeleccionadaId() || this.listaVersiones()[0].id;
  });

  readonly filtroGlobal = signal<string>("");
  readonly filtroPuertas = signal<string | null>(null);
  readonly filtroCilindrada = signal<string | null>(null);
  readonly filtroPotencia = signal<string | null>(null);
  readonly filtroCombustible = signal<string | null>(null);

  constructor() {
    effect(() => {
      const versiones = this.listaVersiones();
      const currentSelection = this.versionSeleccionadaId();

      if (versiones.length > 0 && !currentSelection) {
        untracked(() => {
          this.versionSeleccionadaId.set(versiones[0].id);
        });
      }
    });
  }

  ngOnInit(): void {
    const currentSummary = this.stateService.selectedBrandAndModel();
    
    if (currentSummary.marca?.id && currentSummary.modelo?.id) {
      this.stateService.loadVersionesCatalog(currentSummary.modelo.id);
    }

    const cachedVehicle = this.stateService.state().vehiculoData;
    if (cachedVehicle?.version?.id) {
      this.versionSeleccionadaId.set(cachedVehicle.version.id);
    }
  }

  readonly versionesFiltradas = computed<VersionVehiculo[]>(() => {
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

  readonly objetoVersionSeleccionada = computed<VersionVehiculo | null>(() => {
    const id = this.versionSeleccionadaId();
    if (!id) return null;
    return this.listaVersiones().find((v) => v.id === id) || null;
  });

  readonly botonDeshabilitado = computed<boolean>(
    () => !this.versionSeleccionadaId() || this.cargandoVersiones(),
  );

  readonly opcionesPuertas = computed(() => this.mapearOpcionesUnique("puertas"));
  readonly opcionesCilindrada = computed(() => this.mapearOpcionesUnique("cilindrada"));
  readonly opcionesPotencia = computed(() => this.mapearOpcionesUnique("potencia"));
  readonly opcionesCombustible = computed(() => this.mapearOpcionesUnique("combustible"));

  private mapearOpcionesUnique(propiedad: keyof VersionVehiculo): FilterDropdownOption[] {
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
  if (parsedEvent === undefined) return;

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
  this.currentPage.set(1);
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

onPageChange(event: any): void {
  const page = Number(event.detail);
  if (!isNaN(page)) {
    this.currentPage.set(page);
  }
}

onPageSizeChange(event: Event): void {
  const parsed = parseCustomEvent(event);
  const value = Array.isArray(parsed) ? parsed[0] : parsed;
  const size = Number(value);
  if (!isNaN(size) && size > 0) {
    this.pageSize.set(size);
    this.currentPage.set(1);
  }
}


}