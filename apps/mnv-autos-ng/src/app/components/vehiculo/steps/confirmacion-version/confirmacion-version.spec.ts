import { ComponentFixture, TestBed } from "@angular/core/testing";
import {
  ConfirmacionVersion,
  type FilterDropdownOption,
} from "./confirmacion-version";
import {
  describe,
  it,
  expect,
  beforeEach,
  vi,
  type MockInstance,
} from "vitest";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import {
  VehiculoGlobalState,
  VehiculoStateService,
} from "../../services/vehiculo-state.service";
import { signal, WritableSignal, Signal } from "@angular/core";
import * as util from "@mnv-autos-ng/util";
import {
  VersionVehiculo,
  BrandModelSummary,
} from "../../models/vehiculo.models";

vi.mock("@mnv-autos-ng/util", () => ({
  useIsMobile: vi.fn(),
}));

interface MockVehiculoStateService {
  state: WritableSignal<VehiculoGlobalState>;
  nombreVehiculoCompleto: Signal<string>;
  loadingVersiones: Signal<boolean>;
  versionesRaw: Signal<VersionVehiculo[]>;
  selectedBrandAndModel: MockInstance<() => BrandModelSummary>;
  loadVersionesCatalog: MockInstance<
    (marcaId: string, modeloId: string) => void
  >;
  saveVersionSeleccionada: MockInstance<(version: VersionVehiculo) => void>;
}

describe("ConfirmacionVersion", () => {
  let component: ConfirmacionVersion;
  let fixture: ComponentFixture<ConfirmacionVersion>;
  let mockStateService: MockVehiculoStateService;
  let mockStateSignal: WritableSignal<VehiculoGlobalState>;
  let mockOnStepComplete: MockInstance<(stepOutputData: unknown) => void>;
  let translateService: TranslateService;

  let mockNombreVehiculoSignal: WritableSignal<string>;
  let mockLoadingVersionesSignal: WritableSignal<boolean>;
  let mockVersionesRawSignal: WritableSignal<VersionVehiculo[]>;

  beforeEach(async () => {
    mockStateSignal = signal<VehiculoGlobalState>({
      matriculaOBastidor: null,
      metodoBusqueda: null,
      vehiculoData: {},
      loading: false,
      loadingModelos: false,
      loadingVersiones: false,
      loadingCarrocerias: false,
      loadingAccesorios: false,
      error: null,
      busquedaExitosa: false,
      marcasCatalog: [],
      modelosCatalog: [],
      versionesCatalog: [],
      carroceriasCatalog: [],
      accesoriosCatalog: [],
    });

    mockNombreVehiculoSignal = signal<string>("Volvo XC90");
    mockLoadingVersionesSignal = signal<boolean>(false);

    mockVersionesRawSignal = signal<VersionVehiculo[]>([
      {
        id: "v1",
        nombre: "SUMMUM 7PZ",
        combustible: "Diesel",
        cilindrada: "2400",
        potencia: "185 cv",
        puertas: "5 puertas",
        inicioFabricacion: "04/2009",
      },
      {
        id: "v2",
        nombre: "SUMMUM AUTO 7PZ",
        combustible: "Diesel",
        cilindrada: "2400",
        potencia: "185 cv",
        puertas: "5 puertas",
        inicioFabricacion: "04/2009",
      },
      {
        id: "v3",
        nombre: "R-DESIGN 7PZ",
        combustible: "Diesel",
        cilindrada: "2400",
        potencia: "185 cv",
        puertas: "5 puertas",
        inicioFabricacion: "04/2009",
      },
      {
        id: "v4",
        nombre: "MOMENTUM 7PZ",
        combustible: "Diesel",
        cilindrada: "2400",
        potencia: "185 cv",
        puertas: "5 puertas",
        inicioFabricacion: "04/2009",
      },
      {
        id: "v5",
        nombre: "SUMMUM 7PZ",
        combustible: "Diesel",
        cilindrada: "2400",
        potencia: "185 cv",
        puertas: "5 puertas",
        inicioFabricacion: "04/2009",
      },
    ]);

    mockStateService = {
      state: mockStateSignal,
      nombreVehiculoCompleto: mockNombreVehiculoSignal.asReadonly(),
      loadingVersiones: mockLoadingVersionesSignal.asReadonly(),
      versionesRaw: mockVersionesRawSignal.asReadonly(),
      selectedBrandAndModel: vi.fn().mockReturnValue({
        marca: { id: "vol", nombre: "Volvo", logo: "assets/logos/volvo.png" },
        modelo: { id: "xc90", nombre: "XC90" },
      }),
      loadVersionesCatalog: vi.fn(),
      saveVersionSeleccionada: vi.fn(),
    };

    const mockMobileSignal = signal<boolean>(false);
    vi.mocked(util.useIsMobile).mockReturnValue(mockMobileSignal);

    mockOnStepComplete = vi.fn();

    await TestBed.configureTestingModule({
      imports: [ConfirmacionVersion, TranslateModule.forRoot()],
      providers: [
        { provide: VehiculoStateService, useValue: mockStateService },
      ],
    }).compileComponents();

    translateService = TestBed.inject(TranslateService);

    vi.spyOn(translateService, "instant").mockImplementation(
      (key: string | string[]) => {
        return Array.isArray(key)
          ? key.map((k) => `mock-${k}`).join(", ")
          : `mock-${key}`;
      },
    );

    fixture = TestBed.createComponent(ConfirmacionVersion);
    component = fixture.componentInstance;

    fixture.componentRef.setInput("onStepComplete", mockOnStepComplete);
  });

  it("should create", () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(component.nombreVehiculoCompleto()).toBe("Volvo XC90");
  });

  describe("Initialization (ngOnInit)", () => {
    it("should fallback to unselected states if cache configuration is empty", () => {
      mockStateSignal.update((s) => ({ ...s, vehiculoData: {} }));
      fixture.detectChanges();

      expect(component.versionSeleccionadaId()).toBe("v1");
      expect(component.idSeleccionadaVista()).toBe("v1");
    });

    it("should recover the selected version structural identity if it is present within service stores", () => {
      mockStateSignal.update((s) => ({
        ...s,
        vehiculoData: {
          version: {
            id: "v3",
            nombre: "R-DESIGN 7PZ",
            combustible: "Diesel",
            cilindrada: "2400",
            potencia: "185 cv",
            puertas: "5 puertas",
            inicioFabricacion: "04/2009",
          },
        },
      }));

      fixture.detectChanges();

      expect(component.versionSeleccionadaId()).toBe("v3");
      expect(component.idSeleccionadaVista()).toBe("v3");
    });
  });

  describe("Computed Lookups & Dynamic Aggregations", () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it("should uniquely map available version properties using mapearOpcionesUnique", () => {
      const combustibleOptions: FilterDropdownOption[] =
        component.opcionesCombustible();
      expect(combustibleOptions).toEqual([
        { label: "Diesel", value: "Diesel" },
      ]);
    });

    it("should return fallback data for objetoVersionSeleccionada if no active row id selection is tracked", () => {
      component.versionSeleccionadaId.set(null);

      expect(component.objetoVersionSeleccionada()).toBeNull();
      expect(component.botonDeshabilitado()).toBe(true);
    });

    it("should capture complete row context data when an active selection id matches records", () => {
      component.versionSeleccionadaId.set("v2");

      const match = component.objetoVersionSeleccionada();
      expect(match).not.toBeNull();
      expect(match?.nombre).toBe("SUMMUM AUTO 7PZ");
      expect(component.botonDeshabilitado()).toBe(false);
    });
  });

  describe("Filtering Framework Logic (versionesFiltradas)", () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it("should return all standard records by default without any modifications active", () => {
      expect(component.versionesFiltradas().length).toBe(6);
    });

    it("should slice matches case-insensitively using global textual search keywords", () => {
      const mockSearchEvent = { target: { value: "AuTo" } } as unknown as Event;

      Object.defineProperty(mockSearchEvent, "detail", { value: "AuTo" });
      component.onSearchInput(mockSearchEvent);

      const items = component.versionesFiltradas();
      expect(items.length).toBe(1);
      expect(items[0].id).toBe("v2");
    });

    it("should dynamically filter row lists when standalone parameter combinations are defined", () => {
      const mockEvent = { target: { value: "Diesel" } } as unknown as Event;
      Object.defineProperty(mockEvent, "detail", { value: "Diesel" });

      component.onFiltroChanged("combustible", mockEvent);

      expect(component.versionesFiltradas().length).toBe(5);
    });

    it("should clean filters back down to null records if explicit clearance hooks are called", () => {
      const mockSelectEvent = {
        target: { value: "Diesel" },
      } as unknown as Event;
      Object.defineProperty(mockSelectEvent, "detail", { value: "Diesel" });
      component.onFiltroChanged("combustible", mockSelectEvent);
      expect(component.filtroCombustible()).toBe("Diesel");

      const mockResetEvent = {
        target: { value: "RESET_CLEAR" },
      } as unknown as Event;
      Object.defineProperty(mockResetEvent, "detail", { value: "RESET_CLEAR" });
      component.onFiltroChanged("combustible", mockResetEvent);
      expect(component.filtroCombustible()).toBeNull();
    });
  });

  describe("Workflow Actions & Component Submissions", () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it("should update local row selection identities upon manual selection tile triggers", () => {
      component.onTileSelected("v4");
      expect(component.versionSeleccionadaId()).toBe("v4");
    });

    it("should reject tile selections if an invalid or empty id token payload passes into execution paths", () => {
      component.versionSeleccionadaId.set("v1");
      component.onTileSelected("");
      expect(component.versionSeleccionadaId()).toBe("v1");
    });

    it("should push configuration details out to stores and trigger navigation upon confirmed completion paths", () => {
      component.versionSeleccionadaId.set("v3");
      component.confirmarVersion();
      expect(mockStateService.saveVersionSeleccionada).toHaveBeenCalledWith(
        expect.objectContaining({ id: "v3", nombre: "R-DESIGN 7PZ" }),
      );
      expect(mockOnStepComplete).toHaveBeenCalledWith({
        status: "VERSION_CONFIRMED",
      });
    });
    it("should block storage integration procedures if submission confirmations trigger on empty forms", () => {
      component.versionSeleccionadaId.set(null);
      component.confirmarVersion();
      expect(mockStateService.saveVersionSeleccionada).not.toHaveBeenCalled();
      expect(mockOnStepComplete).not.toHaveBeenCalled();
    });
  });
});
