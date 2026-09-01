import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { vehiculoProgressGuard } from './vehiculo-progress.guard';
import { VehiculoStateService, VehiculoGlobalState } from '../../components/vehiculo/services/vehiculo-state.service';
import { signal, computed, WritableSignal, Signal } from '@angular/core';
import { Marca, Modelo, VersionVehiculo, CarroceriaOption, AccesoriosAdicionales } from '../../components/vehiculo/models/vehiculo.models';

interface MockRouter {
  createUrlTree: Mock<(commands: string[]) => UrlTree>;
}

interface MockVehiculoStateService {
  state: WritableSignal<Partial<VehiculoGlobalState>>;
  marcas: Signal<Marca[]>;
  modelos: Signal<Modelo[]>;
  versionesRaw: Signal<VersionVehiculo[]>;
  carrocerias: Signal<CarroceriaOption[]>;
  accesoriosRaw: Signal<AccesoriosAdicionales[]>;
}

describe('vehiculoProgressGuard Spec Suite', () => {
  let mockRouter: MockRouter;
  let mockStateService: MockVehiculoStateService;
  let mockGlobalStateSignal: WritableSignal<Partial<VehiculoGlobalState>>;
  
  const dummyUrlTree = {} as UrlTree;

  beforeEach(() => {
    mockGlobalStateSignal = signal<Partial<VehiculoGlobalState>>({
      matriculaOBastidor: null,
      vehiculoData: {},
    });

    mockStateService = {
      state: mockGlobalStateSignal,
      marcas: computed(() => []),
      modelos: computed(() => []),
      versionesRaw: computed(() => []),
      carrocerias: computed(() => []),
      accesoriosRaw: computed(() => [])
    };

    mockRouter = {
      createUrlTree: vi.fn().mockReturnValue(dummyUrlTree),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: VehiculoStateService, useValue: mockStateService }
      ]
    });
  });

  const runGuard = (stepParam: string | null) => {
    const routeMock = {
      paramMap: {
        get: (key: string) => (key === 'step' ? stepParam : null)
      }
    } as unknown as ActivatedRouteSnapshot;

    const stateMock = {} as RouterStateSnapshot;

    return TestBed.runInInjectionContext(() => vehiculoProgressGuard(routeMock, stateMock));
  };

  it('should redirect back to step 1 if the route parameter is an unassigned string token', () => {
    const result = runGuard(':step');
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/vehiculos', 'busqueda-matricula']);
    expect(result).toBe(dummyUrlTree);
  });

  it('should always permit access onto index 0 (busqueda-matricula) regardless of state parameters', () => {
    const result = runGuard('busqueda-matricula');
    expect(result).toBe(true);
  });

  it('should redirect forward jumps back down to index 0 if application holds zero cache fields', () => {
    const result = runGuard('confirmacion-version');
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/vehiculos', 'busqueda-matricula']);
    expect(result).toBe(dummyUrlTree);
  });

  it('should permit access onto step 3 if a valid brand and model are present inside the vehicle cache', () => {
    mockGlobalStateSignal.set({
      matriculaOBastidor: 'MANUAL_SEARCH_ACTIVE',
      vehiculoData: {
        marca: { id: '1', nombre: 'AUDI', logo: 'assets/images/marcas/audi.png' },
        modelo: { id: '2', nombre: 'A3' }
      }
    });

    const result = runGuard('confirmacion-version');
    expect(result).toBe(true);
  });

  it('should redirect user backward down onto step 3 if they try to skip onto accessories without locking in fields', () => {
    mockGlobalStateSignal.set({
      matriculaOBastidor: '1234XYZ',
      vehiculoData: {
        marca: { id: '1', nombre: 'FORD', logo: 'assets/images/marcas/ford.png' },
        modelo: { id: '2', nombre: 'FOCUS' }
      }
    });

    const result = runGuard('accesorios');
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/vehiculos', 'confirmacion-version']);
    expect(result).toBe(dummyUrlTree);
  });
});
