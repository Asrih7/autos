import { ComponentFixture, TestBed } from "@angular/core/testing";
import { RestoCampos } from "./resto-campos.component";
import { describe, it, expect, beforeEach, vi, type MockInstance } from "vitest";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { VehiculoGlobalState, VehiculoStateService } from "../../services/vehiculo-state.service";
import { signal, type WritableSignal, type Signal } from "@angular/core";
import * as util from "@mnv-autos-ng/util";
import { CarroceriaOption, RestoCamposModel } from "../../models/vehiculo.models";

vi.mock("@mnv-autos-ng/util", () => ({
  useIsMobile: vi.fn(),
  getProvinciaByPostalCode: vi.fn(),
}));

interface MockVehiculoStateService {
  state: WritableSignal<VehiculoGlobalState>;
  carrocerias: Signal<CarroceriaOption[]>;
  loadingCarrocerias: Signal<boolean>;
  loadCarroceriasCatalog: MockInstance<() => void>;
  saveRestoCampos: MockInstance<(payload: RestoCamposModel) => void>;
}

describe("RestoCampos Component tests", () => {
  let component: RestoCampos;
  let fixture: ComponentFixture<RestoCampos>;
  let mockStateService: MockVehiculoStateService;
  let mockStateSignal: WritableSignal<VehiculoGlobalState>;
  let mockOnStepComplete: MockInstance<(stepOutputData: unknown) => void>;
  let translateService: TranslateService;

  let mockCarroceriasSignal: WritableSignal<CarroceriaOption[]>;
  let mockLoadingCarroceriasSignal: WritableSignal<boolean>;

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
      accesoriosCatalog: []
    });

    mockCarroceriasSignal = signal<CarroceriaOption[]>([
      { codigo: "1", descripcion: "Sin carroceria especial" },
      { codigo: "2", descripcion: "Furgón" },
      { codigo: "3", descripcion: "Camión" }
    ]);
    mockLoadingCarroceriasSignal = signal<boolean>(false);

    mockStateService = {
      state: mockStateSignal,
      carrocerias: mockCarroceriasSignal.asReadonly(),
      loadingCarrocerias: mockLoadingCarroceriasSignal.asReadonly(),
      loadCarroceriasCatalog: vi.fn(),
      saveRestoCampos: vi.fn(),
    };

    const mockMobileSignal = signal<boolean>(false);
    vi.mocked(util.useIsMobile).mockReturnValue(mockMobileSignal);
    vi.mocked(util.getProvinciaByPostalCode).mockReturnValue(null);
    
    mockOnStepComplete = vi.fn();

    await TestBed.configureTestingModule({
      imports: [
        RestoCampos,
        TranslateModule.forRoot(),
      ],
      providers: [
        { provide: VehiculoStateService, useValue: mockStateService },
      ],
    }).compileComponents();

    translateService = TestBed.inject(TranslateService);
    vi.spyOn(translateService, 'instant').mockImplementation((key: string | string[]) => {
      return Array.isArray(key) ? key.map(k => `mock-${k}`).join(', ') : `mock-${key}`;
    });

    fixture = TestBed.createComponent(RestoCampos);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("onStepComplete", mockOnStepComplete);
  });

  it("should create and fetch bodywork options from API on load", () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(mockStateService.loadCarroceriasCatalog).toHaveBeenCalled();
    expect(component.opcionesCarroceria().length).toBe(3);
  });

  describe("Initialization (ngOnInit)", () => {
    it("should initialize with empty fields if cache structure is missing", () => {
      mockStateSignal.update(s => ({ ...s, vehiculoData: {} }));
      fixture.detectChanges();

      expect(component.codigoPostal()).toBe("");
      expect(component.provincia()).toBe("");
      expect(component.fechaMatriculacionIso()).toBe("");
    });

    it("should restore fields correctly when cached service data exists", () => {
      vi.mocked(util.getProvinciaByPostalCode).mockReturnValue("Madrid");

      mockStateSignal.update(s => ({
        ...s,
        vehiculoData: {
          restoCampos: {
            tieneRemolque: true,
            tipoCarroceria: "Furgón",
            codigoPostalRegistro: "28001",
            provinciaRegistro: "Madrid",
            fechaPrimeraMatriculacion: "21/07/2026"
          }
        }
      }));

      fixture.detectChanges();

      expect(component.tieneRemolque()).toBe(true);
      expect(component.tipoCarroceria()).toBe("Furgón");
      expect(component.codigoPostal()).toBe("28001");
      expect(component.provincia()).toBe("Madrid");
      expect(component.fechaMatriculacionIso()).toBe("2026-07-21"); 
    });
  });

  describe("Postal Code Logic & Reactive Effects", () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it("should compute correct validation boundaries for format rules", () => {
      component.codigoPostal.set("280");
      expect(component.cpInvalidoFormato()).toBe(true);

      component.codigoPostal.set("28001");
      expect(component.cpInvalidoFormato()).toBe(false);
    });

    it("should successfully set province when getProvinciaByPostalCode returns a match", () => {
      vi.mocked(util.getProvinciaByPostalCode).mockReturnValue("Madrid");
      
      component.codigoPostal.set("28001");
      fixture.detectChanges();

      expect(component.provincia()).toBe("Madrid");
      expect(component.isCpInvalidoEnEspana()).toBe(false);
      expect(component.cpInvalido()).toBe(false);
    });

    it("should flag an invalid country code error if getProvinciaByPostalCode returns null", () => {
      vi.mocked(util.getProvinciaByPostalCode).mockReturnValue(null);
      
      component.codigoPostal.set("99999");
      fixture.detectChanges();

      expect(component.provincia()).toBe("");
      expect(component.isCpInvalidoEnEspana()).toBe(true);
      expect(component.cpInvalido()).toBe(true);
    });

    it("should reset province and flags if postal code length falls under 5 characters", () => {
      component.provincia.set("Madrid");
      component.isCpInvalidoEnEspana.set(true);

      component.codigoPostal.set("280");
      fixture.detectChanges();

      expect(component.provincia()).toBe("");
      expect(component.isCpInvalidoEnEspana()).toBe(false);
    });
  });

  describe("Form Validation States (botonDeshabilitado)", () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it("should keep submission locked if critical values are missing", () => {
      component.fechaMatriculacionIso.set("");
      component.codigoPostal.set("");
      component.provincia.set("");
      
      expect(component.botonDeshabilitado()).toBe(true);
    });

    it("should enable form submission when all validated criteria fields match structural requirements", () => {
      component.fechaMatriculacionIso.set("2026-07-21");
      component.codigoPostal.set("28001");
      component.provincia.set("Madrid");
      component.isCpInvalidoEnEspana.set(false);

      expect(component.botonDeshabilitado()).toBe(false);
    });
  });

  describe("Event Handlers", () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it("should update bodywork type from custom selector change events", () => {
      const mockEvent = { target: { value: "Camión" } } as unknown as Event;
      Object.defineProperty(mockEvent, 'detail', { value: 'Camión' });
      
      component.onSelectChange(mockEvent);
      expect(component.tipoCarroceria()).toBe("Camión");
    });

    it("should update registration dates from custom input date events", () => {
      const mockEvent = { target: { value: "2026-07-21" } } as unknown as Event;
      Object.defineProperty(mockEvent, 'detail', { value: '2026-07-21' });
      
      component.onDateChange(mockEvent);
      expect(component.fechaMatriculacionIso()).toBe("2026-07-21");
    });

    it("should sanitize text values down to numeric entries inside onInputChange", () => {
      const mockEvent = { target: { value: "28a00b1" } } as unknown as Event;
      Object.defineProperty(mockEvent, 'detail', { value: '28a00b1' });
      
      component.onInputChange(mockEvent);
      expect(component.codigoPostal()).toBe("28001");
    });
  });

  describe("Workflow Confirmation", () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it("should persist formatted details and progress wizard state on click", () => {
      component.tieneRemolque.set(false);
      component.tipoCarroceria.set("Sin carroceria especial");
      component.fechaMatriculacionIso.set("2026-07-21");
      component.codigoPostal.set("28001");
      component.provincia.set("Madrid");
      component.isCpInvalidoEnEspana.set(false);

      component.confirmarDetalles();

      expect(mockStateService.saveRestoCampos).toHaveBeenCalledWith({
        tieneRemolque: false,
        tipoCarroceria: "Sin carroceria especial",
        fechaPrimeraMatriculacion: "21/07/2026",
        codigoPostalRegistro: "28001",
        provinciaRegistro: "Madrid"
      });
      expect(mockOnStepComplete).toHaveBeenCalledWith({ status: "VEHICULO_DETALLES_CONFIRMED" });
    });

    it("should prevent submission routes if component metrics are invalid", () => {
      component.codigoPostal.set("");
      component.confirmarDetalles();

      expect(mockStateService.saveRestoCampos).not.toHaveBeenCalled();
      expect(mockOnStepComplete).not.toHaveBeenCalled();
    });
  });
});
