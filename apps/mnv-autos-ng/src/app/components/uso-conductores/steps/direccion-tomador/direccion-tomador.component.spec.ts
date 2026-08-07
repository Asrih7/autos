import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DireccionTomadorComponent } from "./direccion-tomador.component";
import { describe, it, expect, beforeEach, vi, type MockInstance } from "vitest";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { TranslateModule } from "@ngx-translate/core";

import {
  DatosDomicilioService,
  EMPTY_DATOS_DOMICILIO,
  type DatosDomicilioModel
} from "@mnv-autos-ng/ui";

import { UsoConductoresStateService } from "../../uso-conductores-state.service";
import { of, throwError } from "rxjs";
import { UsoConductoresComponent } from "../../uso-conductores.component";

class MockUsoConductoresComponent {
  showToast = vi.fn();
}

interface MockUsoState {
  direccionTomador: MockInstance<() => DatosDomicilioModel>;
  direccionTomadorCompleted: MockInstance<() => boolean>;
  direccionTomadorFromGoogle: MockInstance<() => boolean>;
  setDireccionTomadorFromGoogle: MockInstance<(v: boolean) => void>;
  resetDireccionTomador: MockInstance<() => void>;
  updateDireccionTomador: MockInstance<(d: DatosDomicilioModel) => void>;
}

interface MockDomicilioService {
  normalizeAddress: MockInstance<(d: DatosDomicilioModel) => any>;
  getAddressData: MockInstance<(cp: string) => any>;
}

describe("DireccionTomadorComponent (Vitest)", () => {
  let fixture: ComponentFixture<DireccionTomadorComponent>;
  let component: DireccionTomadorComponent;

  let mockUsoState: MockUsoState;
  let mockDomicilioService: MockDomicilioService;

  const mockAddress: DatosDomicilioModel = {
    tipoVia: "Calle",
    nombreVia: "Mayor",
    numero: "10",
    codigoPostal: "28013",
    provincia: "Madrid",
    localidad: "Madrid"
  };

  beforeEach(async () => {
    mockUsoState = {
      direccionTomador: vi.fn().mockReturnValue({ ...EMPTY_DATOS_DOMICILIO }),
      direccionTomadorCompleted: vi.fn().mockReturnValue(false),
      direccionTomadorFromGoogle: vi.fn().mockReturnValue(false),
      setDireccionTomadorFromGoogle: vi.fn(),
      resetDireccionTomador: vi.fn(),
      updateDireccionTomador: vi.fn()
    };

    mockDomicilioService = {
      normalizeAddress: vi.fn(),
      getAddressData: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [
        DireccionTomadorComponent,
        HttpClientTestingModule,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: UsoConductoresStateService, useValue: mockUsoState },
        { provide: DatosDomicilioService, useValue: mockDomicilioService },

        // ⭐ FIX: REGISTRAR EL PADRE MOCKEADO
        { provide: MockUsoConductoresComponent, useClass: MockUsoConductoresComponent },
        { provide: UsoConductoresComponent, useExisting: MockUsoConductoresComponent }
      ]
    })
      .overrideComponent(DireccionTomadorComponent, { set: { template: "" } })
      .compileComponents();

    fixture = TestBed.createComponent(DireccionTomadorComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it("should emit stepSelected on init", () => {
    const emitSpy = vi.spyOn(component.stepSelected, "emit");
    fixture.detectChanges();
    expect(emitSpy).toHaveBeenCalledWith("direccion-tomador");
  });

  it("should load initial domicilio when provided", () => {
    component.initial = { domicilio: "Calle Falsa 123" };
    fixture.detectChanges();
    expect(component.model().domicilio).toBe("Calle Falsa 123");
  });

  it("should disable form and enrich address on Google selection", () => {
    mockDomicilioService.getAddressData.mockReturnValue(
      of({
        localidades: [{ value: "Madrid" }],
        provincias: [{ value: "Madrid" }],
        provincia: "Madrid"
      })
    );

    const updateSpy = vi.spyOn(component as any, "updateAddress");

    component.onAddressSelected(mockAddress);

    expect(mockUsoState.setDireccionTomadorFromGoogle).toHaveBeenCalledWith(true);
    expect(component.formDisabled()).toBe(true);
    expect(updateSpy).toHaveBeenCalled();
  });

  it("should update address and reset state when form changes", () => {
    const updateSpy = vi.spyOn(component as any, "updateAddress");

    component.onFormChanged(mockAddress);

    expect(updateSpy).toHaveBeenCalled();
    expect(mockUsoState.resetDireccionTomador).toHaveBeenCalled();
    expect(component.normalized()).toBe(false);
  });

  it("should normalize address successfully", async () => {
    mockDomicilioService.normalizeAddress.mockReturnValue(of(mockAddress));
    const applySpy = vi.spyOn(component as any, "applyNormalizedAddress");

    component.direccion.set(mockAddress);

    const result = await component.normalizeAddress();

    expect(result).toBe(true);
    expect(applySpy).toHaveBeenCalledWith(mockAddress);
  });

  it("should handle normalization failure", async () => {
    mockDomicilioService.normalizeAddress.mockReturnValue(
      throwError(() => new Error("BDI error"))
    );

    const failSpy = vi.spyOn(component as any, "showNormalisationFailure");

    component.direccion.set(mockAddress);

    const result = await component.normalizeAddress();

    expect(result).toBe(false);
    expect(failSpy).toHaveBeenCalled();
  });

  it("should apply normalized address and emit events", () => {
    const saveSpy = vi.spyOn(component.save, "emit");
    const doneSpy = vi.spyOn(component.direccionCompleted, "emit");

    component.applyNormalizedAddress(mockAddress);

    expect(component.normalized()).toBe(true);
    expect(saveSpy).toHaveBeenCalled();
    expect(doneSpy).toHaveBeenCalled();
  });

  

  it("should allow navigation when address complete", () => {
    component.direccion.set(mockAddress);

    const result = component.onParentNext();

    expect(result).toBe(false);
  });

});
