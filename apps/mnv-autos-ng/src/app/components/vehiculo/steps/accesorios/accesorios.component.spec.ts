import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Accesorios } from "./accesorios.component";
import {
  describe,
  it,
  expect,
  beforeEach,
  vi,
  type MockInstance,
} from "vitest";
import { TranslateModule } from "@ngx-translate/core";
import {
  VehiculoGlobalState,
  VehiculoStateService,
} from "../../services/vehiculo-state.service";
import { signal, type WritableSignal, type Signal } from "@angular/core";
import * as util from "@mnv-autos-ng/util";
import { AccesoriosAdicionales } from "../../models/vehiculo.models";

vi.mock("@mnv-autos-ng/util", () => ({
  useIsMobile: vi.fn(),
}));

interface MockVehiculoStateService {
  state: WritableSignal<VehiculoGlobalState>;
  loadingAccesorios: Signal<boolean>;
  accesoriosRaw: Signal<AccesoriosAdicionales[]>;
  loadAccesoriosCatalog: MockInstance<(versionId: string) => void>;
  saveAccesoriosData: MockInstance<
    (
      tieneAccesoriosSeries: boolean,
      accesoriosAdicionales: AccesoriosAdicionales[],
    ) => void
  >;
}

describe("Accesorios Component Tests", () => {
  let component: Accesorios;
  let fixture: ComponentFixture<Accesorios>;
  let mockStateService: MockVehiculoStateService;
  let mockStateSignal: WritableSignal<VehiculoGlobalState>;
  let mockOnStepComplete: MockInstance<(stepOutputData: unknown) => void>;

  let mockLoadingAccesoriosSignal: WritableSignal<boolean>;
  let mockAccesoriosRawSignal: WritableSignal<AccesoriosAdicionales[]>;

  beforeEach(async () => {
    mockStateSignal = signal<VehiculoGlobalState>({
      matriculaOBastidor: "1234BBB",
      metodoBusqueda: "matricula",
      vehiculoData: {
        version: {
          id: "v1",
          nombre: "SUMMUM 7PZ",
          combustible: "Diesel",
          cilindrada: "2400",
          potencia: "185 cv",
          puertas: "5 puertas",
          inicioFabricacion: "04/2009",
        },
        tieneAccesoriosSeries: true,
        accesoriosAdicionales: [],
      },
      loading: false,
      loadingModelos: false,
      loadingVersiones: false,
      loadingCarrocerias: false,
      loadingAccesorios: false,
      error: null,
      busquedaExitosa: true,
      marcasCatalog: [],
      modelosCatalog: [],
      versionesCatalog: [],
      carroceriasCatalog: [],
      accesoriosCatalog: [],
      versionMasContratada: null
    });

    mockLoadingAccesoriosSignal = signal<boolean>(false);

    mockAccesoriosRawSignal = signal<AccesoriosAdicionales[]>([
      {
        checked: false,
        idAccesorio: 101,
        idModeloVehiculo: 99,
        codigoAccesorio: "ACC01",
        anyoAccesorio: "2024",
        mesAccesorio: 1,
        importeAccesorio: 234,
        descripcionAccesorio: "Alarma",
        tipoAccesorio: "Seguridad",
      },
      {
        checked: false,
        idAccesorio: 102,
        idModeloVehiculo: 99,
        codigoAccesorio: "ACC02",
        anyoAccesorio: "2024",
        mesAccesorio: 1,
        importeAccesorio: 500,
        descripcionAccesorio: "Alarma antirrobo hasta 400 €",
        tipoAccesorio: "Seguridad",
      },
      {
        checked: false,
        idAccesorio: 103,
        idModeloVehiculo: 99,
        codigoAccesorio: "ACC03",
        anyoAccesorio: "2024",
        mesAccesorio: 1,
        importeAccesorio: 781,
        descripcionAccesorio: "Arranque codificado",
        tipoAccesorio: "Seguridad",
      },
      {
        checked: false,
        idAccesorio: 201,
        idModeloVehiculo: 99,
        codigoAccesorio: "ACC04",
        anyoAccesorio: "2024",
        mesAccesorio: 1,
        importeAccesorio: 312,
        descripcionAccesorio: "Cierre centralizado",
        tipoAccesorio: "Sonido y multimedia",
      },
      {
        checked: false,
        idAccesorio: 301,
        idModeloVehiculo: 99,
        codigoAccesorio: "FAC01",
        anyoAccesorio: "2024",
        mesAccesorio: 1,
        importeAccesorio: 1200,
        descripcionAccesorio: "Navegador Satélite Oficial",
        tipoAccesorio: "Fabricante",
      },
    ]);

    mockStateService = {
      state: mockStateSignal,
      loadingAccesorios: mockLoadingAccesoriosSignal.asReadonly(),
      accesoriosRaw: mockAccesoriosRawSignal.asReadonly(),
      loadAccesoriosCatalog: vi.fn(),
      saveAccesoriosData: vi.fn(),
    };

    const mockMobileSignal = signal<boolean>(false);
    vi.mocked(util.useIsMobile).mockReturnValue(mockMobileSignal);
    mockOnStepComplete = vi.fn();

    await TestBed.configureTestingModule({
      imports: [Accesorios, TranslateModule.forRoot()],
      providers: [
        { provide: VehiculoStateService, useValue: mockStateService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Accesorios);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("onStepComplete", mockOnStepComplete);
  });

  it("should create and trigger accessories catalog loading based on version context", () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(mockStateService.loadAccesoriosCatalog).toHaveBeenCalledWith("v1");
  });

  describe("Initialization (ngOnInit)", () => {
    it("should retain component defaults if cached state is empty", () => {
      mockStateSignal.update((s) => ({ ...s, vehiculoData: {} }));
      fixture.detectChanges();

      expect(component.tieneAccesoriosSeries()).toBe(true);
      expect(component.arrayIdsSeleccionados()).toEqual([]);
    });

    it("should restore accessories checklist states based on service store history mapping via effect", () => {
      mockStateSignal.update((s) => ({
        ...s,
        vehiculoData: {
          version: {
            id: "v1",
            nombre: "SUMMUM 7PZ",
            combustible: "Diesel",
            cilindrada: "2400",
            potencia: "185 cv",
            puertas: "5 puertas",
            inicioFabricacion: "04/2009",
          },
          tieneAccesoriosSeries: false,
          accesoriosAdicionales: [
            { idAccesorio: 101, checked: true } as AccesoriosAdicionales,
            { idAccesorio: 201, checked: true } as AccesoriosAdicionales,
          ],
        },
      }));

      fixture.detectChanges();

      expect(component.tieneAccesoriosSeries()).toBe(false);
      expect(component.arrayIdsSeleccionados()).toEqual([101, 201]);
    });
  });

  describe("Computed Properties & Filtering Logic (listaAccesoriosFiltrados)", () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it("should only show generic accessories when segment is set to 'genericos'", () => {
      component.tipoSelectorAccesorios.set("genericos");

      const filteredGroups = component.listaAccesoriosFiltrados();
      const containsManufacturer = filteredGroups.some(
        (g) => g.nombreGrupo === "Accesorios del Fabricante",
      );

      expect(containsManufacturer).toBe(false);
      expect(filteredGroups.length).toBeGreaterThan(0);
    });

    it("should only show manufacturer items when segment is set to 'fabricante'", () => {
      component.tipoSelectorAccesorios.set("fabricante");

      const filteredGroups = component.listaAccesoriosFiltrados();

      expect(filteredGroups).toHaveLength(1);
      expect(filteredGroups[0].nombreGrupo).toBe("Accesorios del Fabricante");
    });

    it("should filter accessories by text matching case-insensitively", () => {
      component.tipoSelectorAccesorios.set("genericos");
      component.filtroBusqueda.set("aNtIrRoBo");

      const filteredGroups = component.listaAccesoriosFiltrados();

      expect(filteredGroups).toHaveLength(1);
      expect(filteredGroups[0].items).toHaveLength(1);
      expect(filteredGroups[0].items[0].idAccesorio).toBe(102);
    });

    it("should return an empty array if textual query matches absolutely nothing", () => {
      component.filtroBusqueda.set("NonExistentAccessoryName123");
      expect(component.listaAccesoriosFiltrados()).toEqual([]);
    });
  });

  describe("Interactivity, Handlers & State Toggling", () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it("should modify configuration state via custom input event wrappers (onRadioGroupChange)", () => {
      const mockRadioEvent = { target: { value: "serie" } } as unknown as Event;
      Object.defineProperty(mockRadioEvent, "detail", { value: "serie" });

      component.listaAccesoriosCompleta.update((items) =>
        items.map((i) => ({ ...i, checked: true })),
      );
      component.onRadioGroupChange(mockRadioEvent);

      expect(component.tieneAccesoriosSeries()).toBe(true);
      expect(component.arrayIdsSeleccionados()).toEqual([]);
    });

    it("should modify accessory selector modes via onSegmentChange", () => {
      const mockSegmentEvent = {
        target: { value: "fabricante" },
      } as unknown as Event;
      Object.defineProperty(mockSegmentEvent, "detail", {
        value: "fabricante",
      });

      component.onSegmentChange(mockSegmentEvent);

      expect(component.tipoSelectorAccesorios()).toBe("fabricante");
    });

    it("should toggle checked state of an item when toggleAccesorioSelection is called", () => {
      const targetItem = component.listaAccesoriosCompleta()[0];
      expect(targetItem.checked).toBe(false);

      component.toggleAccesorioSelection(targetItem);
      expect(component.arrayIdsSeleccionados()).toContain(101);

      component.toggleAccesorioSelection(targetItem);
      expect(component.arrayIdsSeleccionados()).not.toContain(101);
    });

    it("should process custom search input updates through onSearchInput method", () => {
      const mockEvent = { target: { value: "alarm" } } as unknown as Event;
      Object.defineProperty(mockEvent, "detail", { value: "alarm" });

      component.onSearchInput(mockEvent);

      expect(component.filtroBusqueda()).toBe("alarm");
    });
  });

  describe("Form Submission Actions", () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it("should save selected items to global state store and progress forward when calling guardarYAvanzar", () => {
      component.tieneAccesoriosSeries.set(false);
      const targetItem = component.listaAccesoriosCompleta()[0];
      component.toggleAccesorioSelection(targetItem);

      component.guardarYAvanzar();

      expect(mockStateService.saveAccesoriosData).toHaveBeenCalledWith(false, [
        { ...targetItem, checked: true },
      ]);
      expect(mockOnStepComplete).toHaveBeenCalledWith({
        status: "ACCESORIOS_CONFIRMED",
      });
    });
    it("should wipe configurations clean and notify standard step completion on saltarYNoDeclarar", () => {
      component.listaAccesoriosCompleta.update((items) =>
        items.map((i) => ({ ...i, checked: true })),
      );
      component.tieneAccesoriosSeries.set(false);
      component.saltarYNoDeclarar();
      expect(component.tieneAccesoriosSeries()).toBe(true);
      expect(component.arrayIdsSeleccionados()).toEqual([]);
      expect(mockStateService.saveAccesoriosData).toHaveBeenCalledWith(
        true,
        [],
      );
      expect(mockOnStepComplete).toHaveBeenCalledWith({
        status: "ACCESORIOS_SKIPPED",
      });
    });
  });
});
