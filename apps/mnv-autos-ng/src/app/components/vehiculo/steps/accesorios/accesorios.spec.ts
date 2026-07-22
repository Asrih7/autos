import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Accesorios } from "./accesorios";
import { describe, it, expect, beforeEach, vi, type Mock, type MockInstance } from "vitest";
import { TranslateModule } from "@ngx-translate/core";
import { VehiculoGlobalState, VehiculoStateService } from "../../services/vehiculo-state.service";
import { signal, WritableSignal } from "@angular/core";
import { AccesoriosAdicionales } from "../../models/vehiculo.models";
import * as util from "@mnv-autos-ng/util";

vi.mock("@mnv-autos-ng/util", () => ({
  useIsMobile: vi.fn(),
}));

interface MockVehiculoStateService {
  state: WritableSignal<Partial<VehiculoGlobalState>>;
  saveAccesoriosData: MockInstance<(tieneAccesoriosSeries: boolean, accesoriosAdicionales: AccesoriosAdicionales[]) => void>;
}

describe("Accesorios", () => {
  let component: Accesorios;
  let fixture: ComponentFixture<Accesorios>;
  let mockStateService: MockVehiculoStateService;
  let mockStateSignal: WritableSignal<Partial<VehiculoGlobalState>>;
  let mockOnStepComplete: Mock<(stepOutputData: unknown) => void>;

  beforeEach(async () => {
    mockStateSignal = signal<Partial<VehiculoGlobalState>>({
      vehiculoData: {
        tieneAccesoriosSeries: true,
        accesoriosAdicionales: [],
      }
    });

    mockStateService = {
      state: mockStateSignal,
      saveAccesoriosData: vi.fn(),
    };

    (util.useIsMobile as Mock).mockReturnValue(signal(false));
    mockOnStepComplete = vi.fn();

    await TestBed.configureTestingModule({
      imports: [
        Accesorios,
        TranslateModule.forRoot(),
      ],
      providers: [
        { provide: VehiculoStateService, useValue: mockStateService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Accesorios);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("onStepComplete", mockOnStepComplete);
  });

  it("should create", () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe("Initialization (ngOnInit)", () => {
    it("should retain component defaults if cached state is empty", () => {
      mockStateSignal.set({ vehiculoData: undefined });
      fixture.detectChanges();

      expect(component.tieneAccesoriosSeries()).toBe(true);
      expect(component.arrayIdsSeleccionados()).toEqual([]);
    });

    it("should restore accessories checklist states based on service store history", () => {
      mockStateSignal.set({
        vehiculoData: {
          tieneAccesoriosSeries: false,
          accesoriosAdicionales: [
            { idAccesorio: 101, checked: true } as AccesoriosAdicionales,
            { idAccesorio: 201, checked: true } as AccesoriosAdicionales
          ]
        }
      });

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
      const containsManufacturer = filteredGroups.some(g => g.nombreGrupo === "Accesorios del Fabricante");
      
      expect(containsManufacturer).toBe(false);
      expect(filteredGroups.length).toBeGreaterThan(0);
    });

    it("should only show manufacturer items when segment is set to 'fabricante'", () => {
      component.tipoSelectorAccesorios.set("fabricante");
      
      const filteredGroups = component.listaAccesoriosFiltrados();
      
      expect(filteredGroups.length).toBe(1);
      expect(filteredGroups[0].nombreGrupo).toBe("Accesorios del Fabricante");
    });

    it("should filter accessories by text matching case-insensitively", () => {
      component.tipoSelectorAccesorios.set("genericos");
      component.filtroBusqueda.set("aNtIrRoBo"); 

      const filteredGroups = component.listaAccesoriosFiltrados();
      
      expect(filteredGroups.length).toBe(1);
      expect(filteredGroups[0].items.length).toBe(1);
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
      const mockRadioEvent = { detail: "serie" } as CustomEvent<string>;
      component.listaAccesoriosCompleta.update(items => items.map(i => ({ ...i, checked: true })));
      
      component.onRadioGroupChange(mockRadioEvent);

      expect(component.tieneAccesoriosSeries()).toBe(true);
      expect(component.arrayIdsSeleccionados()).toEqual([]);
    });

    it("should modify accessory selector modes via onSegmentChange", () => {
      const mockSegmentEvent = { detail: "fabricante" } as CustomEvent<"genericos" | "fabricante">;
      
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
      const mockEvent = new CustomEvent("balInput", {
        detail: "alarm"
      });

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
        { ...targetItem, checked: true }
      ]);
      expect(mockOnStepComplete).toHaveBeenCalledWith({ status: "ACCESORIOS_CONFIRMED" });
    });

    it("should wipe configurations clean and notify standard step completion on saltarYNoDeclarar", () => {
      component.listaAccesoriosCompleta.update(items => items.map(i => ({ ...i, checked: true })));
      component.tieneAccesoriosSeries.set(false);

      component.saltarYNoDeclarar();

      expect(component.tieneAccesoriosSeries()).toBe(true);
      expect(component.arrayIdsSeleccionados()).toEqual([]);
      expect(mockStateService.saveAccesoriosData).toHaveBeenCalledWith(true, []);
      expect(mockOnStepComplete).toHaveBeenCalledWith({ status: "ACCESORIOS_SKIPPED" });
    });
  });
});
