import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subject, of } from 'rxjs';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import { UsoConductoresComponent } from './uso-conductores.component';
import { UsoConductoresStateService } from './uso-conductores-state.service';
import { PageNavigationService } from '@mnv-autos-ng/navigation';
import { DatosDomicilioService } from '@mnv-autos-ng/ui';

describe('UsoConductoresComponent', () => {
  let component: UsoConductoresComponent;

  let routerMock: {
    events: Subject<any>;
    url: string;
    parseUrl: ReturnType<typeof vi.fn>;
    navigate: ReturnType<typeof vi.fn>;
  };
  let navServiceMock: { activePageConfig: { set: ReturnType<typeof vi.fn> } };
  let domicilioServiceMock: {
    normalizeAddress: ReturnType<typeof vi.fn>;
    getAddressData: ReturnType<typeof vi.fn>;
  };

  const intervinientesSig = signal<{ tomadorEsPropietario: boolean }>({ tomadorEsPropietario: false });
  const canContinueFromUsoSig = signal(false);
  const canContinueFromIntervinientesSig = signal(false);
  const canContinueFromSeguroAnteriorSig = signal(false);
  const canContinueFromFechaEfectoSeguroSig = signal(false);
  const direccionTomadorSig = signal({
    tipoVia: '', nombreVia: '', numero: '', codigoPostal: '', provincia: '', localidad: '',
  });
  const direccionTomadorCompletedSig = signal(false);
  const direccionTomadorFromGoogleSig = signal(false);
  const stepsLoadedSig = signal<boolean[]>([]);

  let stateServiceMock: Record<string, any>;

  const resetSignals = () => {
    intervinientesSig.set({ tomadorEsPropietario: false });
    canContinueFromUsoSig.set(false);
    canContinueFromIntervinientesSig.set(false);
    canContinueFromSeguroAnteriorSig.set(false);
    canContinueFromFechaEfectoSeguroSig.set(false);
    direccionTomadorSig.set({
      tipoVia: '', nombreVia: '', numero: '', codigoPostal: '', provincia: '', localidad: '',
    });
    direccionTomadorCompletedSig.set(false);
    direccionTomadorFromGoogleSig.set(false);
    stepsLoadedSig.set([]);
  };

  beforeEach(async () => {
    resetSignals();

    routerMock = {
      events: new Subject<any>(),
      url: '/uso-conductores/uso-vehiculo',
      parseUrl: vi.fn(() => ({
        root: { children: { primary: { segments: [{ path: 'uso-conductores' }, { path: 'uso-vehiculo' }] } } },
      })),
      navigate: vi.fn(() => Promise.resolve(true)),
    };

    navServiceMock = { activePageConfig: { set: vi.fn() } };

    domicilioServiceMock = {
      normalizeAddress: vi.fn(),
      getAddressData: vi.fn(),
    };

    stateServiceMock = {
      intervinientes: intervinientesSig,
      canContinueFromUso: canContinueFromUsoSig,
      canContinueFromIntervinientes: canContinueFromIntervinientesSig,
      canContinueFromSeguroAnterior: canContinueFromSeguroAnteriorSig,
      canContinueFromFechaEfectoSeguro: canContinueFromFechaEfectoSeguroSig,
      direccionTomador: direccionTomadorSig,
      direccionTomadorCompleted: direccionTomadorCompletedSig,
      direccionTomadorFromGoogle: direccionTomadorFromGoogleSig,
      stepsLoaded: stepsLoadedSig,
      setStepLoaded: vi.fn(),
      clearStepLoaded: vi.fn(),
      setLastStep: vi.fn(),
      clearDireccionTomador: vi.fn(),
      updateDireccionTomador: vi.fn(),
      completeDireccionTomador: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [UsoConductoresComponent],
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: PageNavigationService, useValue: navServiceMock },
        { provide: UsoConductoresStateService, useValue: stateServiceMock },
        { provide: DatosDomicilioService, useValue: domicilioServiceMock },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(UsoConductoresComponent);
    component = fixture.componentInstance;
    // Deliberately NOT calling fixture.detectChanges(): that would run
    // ngAfterViewInit, which needs the real #stepOutlet/#buttonAnchor refs
    // and dynamically loads real step components we don't have visibility into.
    // We exercise ngOnInit/ngOnDestroy and pure signal logic directly instead.
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('registers page config with the expected static fields', () => {
      component.ngOnInit();

      expect(navServiceMock.activePageConfig.set).toHaveBeenCalledWith(
        expect.objectContaining({
          pageId: 'uso-conductores',
          previousPageUrl: '/vehiculos/accesorios',
          previousPageLabel: 'Vehículos',
          nextPageUrl: '/precio-coberturas',
        }),
      );
    });

    
  });

  describe('ngOnDestroy', () => {
    it('clears the active page config and any tracked step refs', () => {
      component['stepComponentRefs'].set('dummy', {} as any);

      component.ngOnDestroy();

      expect(navServiceMock.activePageConfig.set).toHaveBeenCalledWith(null);
      expect(component['stepComponentRefs'].size).toBe(0);
    });
  });

  describe('steps (computed)', () => {
    it('excludes direccion-tomador when tomador is the propietario', () => {
      intervinientesSig.set({ tomadorEsPropietario: true });

      const ids = component.steps().map((s) => s.id);

      expect(ids).not.toContain('direccion-tomador');
    });

    it('includes direccion-tomador when tomador is not the propietario', () => {
      intervinientesSig.set({ tomadorEsPropietario: false });

      const ids = component.steps().map((s) => s.id);

      expect(ids).toContain('direccion-tomador');
    });
  });

  describe('nextEnabled (computed)', () => {
    const setActiveStep = (stepId: string) => {
      const index = component.steps().findIndex((s) => s.id === stepId);
      component['activeIndex'].set(index);
    };

    it('reflects canContinueFromUso on the uso-vehiculo step', () => {
      setActiveStep('uso-vehiculo');
      canContinueFromUsoSig.set(false);
      expect(component.nextEnabled()).toBe(false);

      canContinueFromUsoSig.set(true);
      expect(component.nextEnabled()).toBe(true);
    });

    

   

    it('requires a complete address on direccion-tomador', () => {
      intervinientesSig.set({ tomadorEsPropietario: false });
      setActiveStep('direccion-tomador');

      expect(component.nextEnabled()).toBe(false);

      direccionTomadorSig.set({
        tipoVia: 'Calle', nombreVia: 'Falsa', numero: '1',
        codigoPostal: '28080', provincia: 'Madrid', localidad: 'Madrid',
      });

      expect(component.nextEnabled()).toBe(true);
    });

    it('is always enabled on fecha-efecto-seguro', () => {
      setActiveStep('fecha-efecto-seguro');
      expect(component.nextEnabled()).toBe(true);
    });
  });

  describe('goNext', () => {
    const setActiveStep = (stepId: string) => {
      const index = component.steps().findIndex((s) => s.id === stepId);
      component['activeIndex'].set(index);
    };

    it('does nothing when nextEnabled is false', async () => {
      setActiveStep('uso-vehiculo');
      canContinueFromUsoSig.set(false);

      await component.goNext();

      expect(routerMock.navigate).not.toHaveBeenCalled();
    });

    it('navigates to the following step when enabled and unblocked', async () => {
      setActiveStep('uso-vehiculo');
      canContinueFromUsoSig.set(true);

      const nextStepId = component.steps()[1].id;

      await component.goNext();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/uso-conductores', nextStepId]);
      expect(stateServiceMock['setLastStep']).toHaveBeenCalledWith(nextStepId);
    });

    it('does not navigate when the active step blocks via onParentNext', async () => {
      setActiveStep('uso-vehiculo');
      canContinueFromUsoSig.set(true);
      component['activeStepInstance'] = { onParentNext: () => true };

      await component.goNext();

      expect(routerMock.navigate).not.toHaveBeenCalled();
    });

    it('does nothing on the last step (no next step to advance to)', async () => {
      const steps = component.steps();
      setActiveStep(steps[steps.length - 1].id);
      canContinueFromFechaEfectoSeguroSig.set(true);

      await component.goNext();

      expect(routerMock.navigate).not.toHaveBeenCalled();
    });
  });
});