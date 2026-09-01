import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BusquedaMatricula } from "./busqueda-matricula.component";
import { describe, it, expect, beforeEach, vi, type MockInstance } from "vitest";
import { TranslateModule } from "@ngx-translate/core";
import { VehiculoGlobalState, VehiculoStateService } from "../../services/vehiculo-state.service";
import { signal, WritableSignal, type Signal } from "@angular/core";
import * as util from "@mnv-autos-ng/util";
import { StepCompleteCallback } from "../../vehiculo.component";
import { MetodoBusqueda } from "../../models/vehiculo.models";

vi.mock("@mnv-autos-ng/util", () => ({
  useIsMobile: vi.fn(),
}));

interface MockVehiculoStateService {
  state: WritableSignal<VehiculoGlobalState>;
  loading: Signal<boolean>;
  error: Signal<string | null>;
  busquedaExitosa: Signal<boolean>;
  buscarVehiculoPorApi: MockInstance<(metodo: MetodoBusqueda, valor: string) => void>;
  saveMatriculaOBastidor: MockInstance<(metodo: MetodoBusqueda, valor: string) => void>;
  clearBusquedaExitosa: MockInstance<() => void>;
  prepareForManualSearch: MockInstance<() => void>;
}

describe("BusquedaMatricula Spec Suite", () => {
  let component: BusquedaMatricula;
  let fixture: ComponentFixture<BusquedaMatricula>;
  let mockStateService: MockVehiculoStateService;
  let mockStateSignal: WritableSignal<VehiculoGlobalState>;
  let mockLoadingSignal: WritableSignal<boolean>;
  let mockErrorSignal: WritableSignal<string | null>;
  let mockBusquedaExitosaSignal: WritableSignal<boolean>;
  let mockOnStepComplete: MockInstance<StepCompleteCallback>;

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
      versionMasContratada: null
    });

    mockLoadingSignal = signal<boolean>(false);
    mockErrorSignal = signal<string | null>(null);
    mockBusquedaExitosaSignal = signal<boolean>(false);

    mockStateService = {
      state: mockStateSignal,
      loading: mockLoadingSignal.asReadonly(),
      error: mockErrorSignal.asReadonly(),
      busquedaExitosa: mockBusquedaExitosaSignal.asReadonly(),
      buscarVehiculoPorApi: vi.fn(),
      saveMatriculaOBastidor: vi.fn(),
      clearBusquedaExitosa: vi.fn(),
      prepareForManualSearch: vi.fn()
    };

    const mockMobileSignal = signal<boolean>(false);
    vi.mocked(util.useIsMobile).mockReturnValue(mockMobileSignal);

    mockOnStepComplete = vi.fn();

    await TestBed.configureTestingModule({
      imports: [
        BusquedaMatricula, 
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: VehiculoStateService, useValue: mockStateService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BusquedaMatricula);
    component = fixture.componentInstance;

    fixture.componentRef.setInput("onStepComplete", mockOnStepComplete);
  });

  it("should create", () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe("Initialization (ngOnInit)", () => {
    it("should initialize with default states if service state is empty", () => {
      fixture.detectChanges();
      expect(component.opcionSeleccionada()).toBe("matricula");
      expect(component.textoBusqueda()).toBe("");
    });

    it("should restore saved state values from service if they exist", () => {
      mockStateSignal.update(s => ({
        ...s,
        metodoBusqueda: "bastidor",
        matriculaOBastidor: "1234567890ABCDEFG"
      }));

      fixture.detectChanges();

      expect(component.opcionSeleccionada()).toBe("bastidor");
      expect(component.textoBusqueda()).toBe("1234567890ABCDEFG");
    });

    it("should set visible text to empty string if service state indicates manual search is active", () => {
      mockStateSignal.update(s => ({
        ...s,
        metodoBusqueda: "matricula",
        matriculaOBastidor: "MANUAL_SEARCH_ACTIVE"
      }));

      fixture.detectChanges();

      expect(component.textoBusqueda()).toBe("");
    });
  });

  describe("Validation Rules & Computed Properties", () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it("should apply correct patterns and templates for 'matricula'", () => {
      component.opcionSeleccionada.set("matricula");
      
      expect(component.patronDinamico()).toBe("^[0-9]{4}[BCDFGHJKLMNPRSTVWXYZ]{3}$");
      expect(component.placeholderDinamico()).toContain("placeholders.matricula");
      expect(component.mensajeErrorDinamico()).toContain("errors.matricula");
    });

    it("should apply correct patterns and templates for 'bastidor'", () => {
      component.opcionSeleccionada.set("bastidor");

      expect(component.patronDinamico()).toBe("^[A-Z0-9]{17}$");
      expect(component.placeholderDinamico()).toContain("placeholders.bastidor");
      expect(component.mensajeErrorDinamico()).toContain("errors.bastidor");
    });

    it("should validate spanish license plate correctly", () => {
      component.opcionSeleccionada.set("matricula");
      
      component.textoBusqueda.set("1234BBB");
      expect(component.esTextoValido()).toBe(true);
      expect(component.esInvalido()).toBe(false);
      expect(component.botonDeshabilitado()).toBe(false);

      component.textoBusqueda.set("1234AAA");
      expect(component.esTextoValido()).toBe(false);
      expect(component.esInvalido()).toBe(true);
      expect(component.botonDeshabilitado()).toBe(true);
    });

    it("should validate VIN/bastidor correctly", () => {
      component.opcionSeleccionada.set("bastidor");
      
      component.textoBusqueda.set("VALID17CHARVIN123");
      expect(component.esTextoValido()).toBe(true);

      component.textoBusqueda.set("SHORT123");
      expect(component.esTextoValido()).toBe(false);
    });
  });

  describe("Event Handlers & Interactivity", () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it("should clean text inputs and change options upon calling alCambiarOpcion", () => {
      component.textoBusqueda.set("SOMEVALUE");
      
      const mockCustomEvent = { detail: "bastidor" } as unknown as Event;
      component.alCambiarOpcion(mockCustomEvent);

      expect(component.opcionSeleccionada()).toBe("bastidor");
      expect(component.textoBusqueda()).toBe("");
    });

    it("should transform string to uppercase upon triggering onInputUpdate", () => {
      const mockCustomEvent = { detail: "1234bBb" } as unknown as Event;
      component.onInputUpdate(mockCustomEvent);

      expect(component.textoBusqueda()).toBe("1234BBB");
    });
  });

  describe("Actions (alBuscar & activarBusquedaManual)", () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it("should trigger state service API call on valid form submit (alBuscar)", () => {
      component.opcionSeleccionada.set("matricula");
      component.textoBusqueda.set("1234BBB");

      component.alBuscar();

      expect(mockStateService.buscarVehiculoPorApi).toHaveBeenCalledWith("matricula", "1234BBB");
    });

    it("should trigger step callback and clear state when busquedaExitosa transitions to true", () => {
      fixture.detectChanges();
      
      mockBusquedaExitosaSignal.set(true);
      fixture.detectChanges();

      expect(mockOnStepComplete).toHaveBeenCalledWith({ status: "REGISTRATION_LOOKUP_COMPLETE" });
      expect(mockStateService.clearBusquedaExitosa).toHaveBeenCalled();
    });

    it("should block search calls if formatting rules fail criteria", () => {
      component.opcionSeleccionada.set("matricula");
      component.textoBusqueda.set("INVALID");

      component.alBuscar();

      expect(mockStateService.buscarVehiculoPorApi).not.toHaveBeenCalled();
      expect(mockOnStepComplete).not.toHaveBeenCalled();
    });

    it("should process manual overrides smoothly using provided details", () => {
      component.opcionSeleccionada.set("matricula");
      component.textoBusqueda.set("1234");

      component.activarBusquedaManual();

      expect(mockStateService.prepareForManualSearch).toHaveBeenCalled();
      expect(mockStateService.saveMatriculaOBastidor).toHaveBeenCalledWith("matricula", "MANUAL_SEARCH_ACTIVE");
      
      expect(mockOnStepComplete).toHaveBeenCalledWith({ status: "MANUAL_SEARCH_FORCED" });
      expect(component.textoBusqueda()).toBe("");
    });

    it("should fall back to placeholder token if manual override runs on an empty string field", () => {
      component.opcionSeleccionada.set("bastidor");
      component.textoBusqueda.set("");

      component.activarBusquedaManual();

      expect(mockStateService.prepareForManualSearch).toHaveBeenCalled();
      expect(mockStateService.saveMatriculaOBastidor).toHaveBeenCalledWith("bastidor", "MANUAL_SEARCH_ACTIVE");
      expect(mockOnStepComplete).toHaveBeenCalledWith({ status: "MANUAL_SEARCH_FORCED" });
    });
  });
});
