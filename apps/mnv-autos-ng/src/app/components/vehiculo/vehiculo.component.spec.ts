import { ComponentFixture, TestBed } from "@angular/core/testing";
import { VehiculoComponent } from "./vehiculo.component";
import { PageNavigationService } from "@mnv-autos-ng/navigation";
import { VehiculoStateService, VehiculoGlobalState } from "./services/vehiculo-state.service";
import { Router } from "@angular/router";
import { signal, computed, WritableSignal, Signal } from "@angular/core";
import { describe, it, expect, beforeEach, vi, Mock } from "vitest";
import { Marca, Modelo, VersionVehiculo, CarroceriaOption, AccesoriosAdicionales } from "./models/vehiculo.models";

interface MockPageNavigationService {
  activePageConfig: { set: Mock<(value: unknown) => void> };
  currentStepCallback: { set: Mock<(value: unknown) => void> };
}

interface MockRouter {
  navigate: Mock<(commands: string[], extras?: unknown) => Promise<boolean>>;
  navigateByUrl: Mock<(url: string, extras?: unknown) => Promise<boolean>>;
}

interface MockVehiculoStateService {
  state: WritableSignal<Partial<VehiculoGlobalState>>;
  marcas: Signal<Marca[]>;
  modelos: Signal<Modelo[]>;
  versionesRaw: Signal<VersionVehiculo[]>;
  carrocerias: Signal<CarroceriaOption[]>;
  accesoriosRaw: Signal<AccesoriosAdicionales[]>;
}

describe("VehiculoComponent Spec Suite", () => {
  let component: VehiculoComponent;
  let fixture: ComponentFixture<VehiculoComponent>;
  
  let mockNavService: MockPageNavigationService;
  let mockStateService: MockVehiculoStateService;
  let mockRouter: MockRouter;

  let mockGlobalStateSignal: WritableSignal<Partial<VehiculoGlobalState>>;

  beforeEach(async () => {
    mockGlobalStateSignal = signal<Partial<VehiculoGlobalState>>({
      matriculaOBastidor: null,
      vehiculoData: {},
      loadingVersiones: false
    });

    mockStateService = {
      state: mockGlobalStateSignal,
      marcas: computed(() => []),
      modelos: computed(() => []),
      versionesRaw: computed(() => []),
      carrocerias: computed(() => []),
      accesoriosRaw: computed(() => [])
    };

    mockNavService = {
      activePageConfig: { set: vi.fn() },
      currentStepCallback: { set: vi.fn() }
    };

    mockRouter = {
      navigate: vi.fn().mockResolvedValue(true),
      navigateByUrl: vi.fn().mockResolvedValue(true)
    };

    await TestBed.configureTestingModule({
      imports: [VehiculoComponent],
      providers: [
        { provide: PageNavigationService, useValue: mockNavService },
        { provide: VehiculoStateService, useValue: mockStateService },
        { provide: Router, useValue: mockRouter }
      ]
    })
    .overrideComponent(VehiculoComponent, {
      set: { template: "<div>Mock Shell Template</div>" }
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehiculoComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput("step", "busqueda-matricula");
  });

  it("should initialize the component layer securely", () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(mockNavService.activePageConfig.set).toHaveBeenCalled();
  });

  describe("Atomic Safe Navigation Core Rules", () => {
    it("should step sequentially down the array on a standard callback trigger execution", () => {
      fixture.detectChanges();
      
      component.handleStepNavigation("busqueda-matricula", {});
      
      expect(mockRouter.navigate).toHaveBeenCalledWith(["/vehiculos", "busqueda-manual"]);
    });

    it("should evaluate cross-cutting API success criteria payloads and route to the correct node", () => {
      mockGlobalStateSignal.set({
        matriculaOBastidor: "5678ABC",
        vehiculoData: { 
          marca: { id: "1", nombre: "BMW", logo: "assets/images/marcas/bmw.png" }, 
          modelo: { id: "2", nombre: "X5" },
          version: undefined,
          tieneAccesoriosSeries: false,
          restoCampos: { tieneRemolque: false, tipoCarroceria: "", fechaPrimeraMatriculacion: "", codigoPostalRegistro: "", provinciaRegistro: "" },
          clasificacion: { categoriaVehiculo: "", tipoVehiculo: undefined, claseVehiculo: "" },
          accesoriosAdicionales: []
        },
        loadingVersiones: false
      });

      fixture.detectChanges();

      component.handleStepNavigation("busqueda-matricula", { status: "REGISTRATION_LOOKUP_COMPLETE" });

      expect(mockRouter.navigate).toHaveBeenCalledWith(["/vehiculos", "confirmacion-version"]);
    });
  });
});
