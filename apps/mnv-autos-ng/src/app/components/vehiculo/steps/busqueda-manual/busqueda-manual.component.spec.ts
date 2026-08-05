import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BusquedaManualComponent } from "./busqueda-manual.component";
import { describe, it, expect, beforeEach, vi, type MockInstance } from "vitest";
import { TranslateModule } from "@ngx-translate/core";
import { VehiculoStateService } from "../../services/vehiculo-state.service";
import { signal, type WritableSignal, type Signal } from "@angular/core";
import * as util from "@mnv-autos-ng/util";
import { Marca, Modelo, BrandModelSummary } from "../../models/vehiculo.models";

vi.mock("@mnv-autos-ng/util", () => ({
  useIsMobile: vi.fn(),
}));

interface MockVehiculoStateService {
  marcas: Signal<Marca[]>;
  modelos: Signal<Modelo[]>;
  loadingModelos: Signal<boolean>;
  selectedBrandAndModel: MockInstance<() => BrandModelSummary>;
  loadMarcasCatalog: MockInstance<() => void>;
  loadModelosCatalog: MockInstance<(marcaId: string) => void>;
  saveMarca: MockInstance<(marca: Marca) => void>;
  saveModelo: MockInstance<(modelo: Modelo) => void>;
}

describe("BusquedaManualComponent", () => {
  let component: BusquedaManualComponent;
  let fixture: ComponentFixture<BusquedaManualComponent>;
  let mockStateService: MockVehiculoStateService;
  let mockOnStepComplete: MockInstance<(stepOutputData: unknown) => void>;

  let mockMarcasSignal: WritableSignal<Marca[]>;
  let mockModelosSignal: WritableSignal<Modelo[]>;
  let mockLoadingModelosSignal: WritableSignal<boolean>;

  beforeEach(async () => {
    mockMarcasSignal = signal<Marca[]>([
      { id: "aud", nombre: "Audi", logo: "assets/logos/audi.png" },
      { id: "kia", nombre: "Kia", logo: "assets/logos/kia.png" }
    ]);
    mockModelosSignal = signal<Modelo[]>([
      { id: "golf", nombre: "Golf" },
      { id: "polo", nombre: "Polo" }
    ]);
    mockLoadingModelosSignal = signal<boolean>(false);

    mockStateService = {
      marcas: mockMarcasSignal.asReadonly(),
      modelos: mockModelosSignal.asReadonly(),
      loadingModelos: mockLoadingModelosSignal.asReadonly(),
      selectedBrandAndModel: vi.fn().mockReturnValue({
        marca: { id: "", nombre: "", logo: "" },
        modelo: { id: "", nombre: "" }
      }),
      loadMarcasCatalog: vi.fn(),
      loadModelosCatalog: vi.fn(),
      saveMarca: vi.fn(),
      saveModelo: vi.fn(),
    };

    const mockMobileSignal = signal<boolean>(false);
    vi.mocked(util.useIsMobile).mockReturnValue(mockMobileSignal);

    mockOnStepComplete = vi.fn();

    await TestBed.configureTestingModule({
      imports: [
        BusquedaManualComponent,
        TranslateModule.forRoot(),
      ],
      providers: [
        { provide: VehiculoStateService, useValue: mockStateService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BusquedaManualComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput("onStepComplete", mockOnStepComplete);
  });

  it("should create", () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe("Initialization (ngOnInit)", () => {
    it("should remain unselected if state service passes clean structural entries", () => {
      fixture.detectChanges();
      
      expect(mockStateService.loadMarcasCatalog).toHaveBeenCalled();
      expect(component.marcaSeleccionadaId()).toBeNull();
      expect(component.modeloSeleccionadoId()).toBeNull();
      expect(component.mostrarModelos()).toBe(false);
    });

    it("should populate matching structural keys if a valid brand exists in state service", () => {
      mockStateService.selectedBrandAndModel.mockReturnValue({
        marca: { id: "aud", nombre: "Audi", logo: "assets/logos/audi.png" },
        modelo: { id: "", nombre: "" }
      });

      fixture.detectChanges();

      expect(component.marcaSeleccionadaId()).toBe("aud");
      expect(component.modeloSeleccionadoId()).toBeNull();
      expect(component.mostrarModelos()).toBe(false);
    });

    it("should expand the full block elements if both brand and model exist in state service", () => {
      mockStateService.selectedBrandAndModel.mockReturnValue({
        marca: { id: "aud", nombre: "Audi", logo: "assets/logos/audi.png" },
        modelo: { id: "golf", nombre: "Golf" },
      });

      fixture.detectChanges();

      expect(component.marcaSeleccionadaId()).toBe("aud");
      expect(component.modeloSeleccionadoId()).toBe("golf");
      expect(component.mostrarModelos()).toBe(true);
    });
  });

  describe("Workflow Actions & Selection Updates", () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it("should submit brand selections and expand model field blocks upon calling confirmarMarca", () => {
      component.marcaSeleccionadaId.set("aud");

      component.confirmarMarca();

      expect(mockStateService.saveMarca).toHaveBeenCalledWith({
        id: "aud",
        nombre: "Audi",
        logo: "assets/logos/audi.png",
      });
      expect(component.mostrarModelos()).toBe(true);
    });

    it("should skip state collection saves if confirmation fires without an active brand selected", () => {
      component.marcaSeleccionadaId.set(null);

      component.confirmarMarca();

      expect(mockStateService.saveMarca).not.toHaveBeenCalled();
      expect(component.mostrarModelos()).toBe(true);
    });

    it("should cleanly assign string targets into the active model signals upon onModeloChanged", () => {
      const mockEvent = { detail: "golf" } as unknown as Event;
      
      component.onModeloChanged(mockEvent);
      
      expect(component.modeloSeleccionadoId()).toBe("golf");
    });

    it("should translate whitespace or empty entries into explicit null records during updates", () => {
      const mockEvent = { detail: "   " } as unknown as Event;
      
      component.onModeloChanged(mockEvent);
      
      expect(component.modeloSeleccionadoId()).toBeNull();
    });

    it("should dispatch service events and trigger the output flow chain upon calling confirmarModelo", () => {
      component.modeloSeleccionadoId.set("golf");

      component.confirmarModelo();

      expect(mockStateService.saveModelo).toHaveBeenCalledWith({ id: "golf", nombre: "Golf" });
      expect(mockOnStepComplete).toHaveBeenCalledWith({ status: "MANUAL_SELECTION_COMPLETE" });
    });

    it("should block data output executions if structural requirements are missing on submission", () => {
      component.modeloSeleccionadoId.set(null);

      component.confirmarModelo();

      expect(mockStateService.saveModelo).not.toHaveBeenCalled();
      expect(mockOnStepComplete).not.toHaveBeenCalled();
    });
  });
});
