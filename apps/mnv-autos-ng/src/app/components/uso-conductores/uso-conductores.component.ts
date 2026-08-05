import {
  AfterViewInit,
  Component,
  Type,
  ComponentRef,
  effect,
  computed,
  inject,
  signal,
  untracked,
  ViewChild,
  ViewContainerRef,
  OnInit,
  OnDestroy,
  DestroyRef,
  Injector,
  ElementRef,
  Renderer2, 
} from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { filter, firstValueFrom } from "rxjs";
import { BalButton , BalButtonGroup, BalToast} from "@baloise/ds-angular";
import { TranslateModule } from "@ngx-translate/core";

import { USO_CONDUCTORES_STEPS } from "./uso-conductores.steps";
import { UsoConductoresStateService } from "./uso-conductores-state.service";
import { PageNavigationService } from "@mnv-autos-ng/navigation";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { DatosDomicilioModel, DatosDomicilioService } from "@mnv-autos-ng/ui";

@Component({
  selector: "app-uso-conductores",
  standalone: true,
  imports: [BalButton, BalButtonGroup, BalToast, TranslateModule],
  templateUrl: "./uso-conductores.component.html",
  styleUrl: "./uso-conductores.component.scss",
})
export class UsoConductoresComponent
  implements AfterViewInit, OnInit, OnDestroy
{
  private readonly router = inject(Router);
  private readonly state = inject(UsoConductoresStateService);
  private readonly navService = inject(PageNavigationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector); 
  private readonly datosDomicilioService = inject(DatosDomicilioService);
  private navigating = false;
  private activeStepInstance: ParentNextStep | null = null;
  private readonly stepComponentRefs = new Map<string, ComponentRef<any>>();
  toastOpen = signal(false);
toastMessage = signal('');
toastType = signal<'success' | 'info' | 'warning' | 'danger'>('success');
toastDurationMs = 3000;

  @ViewChild("stepOutlet", { read: ViewContainerRef, static: true })
  private stepOutlet!: ViewContainerRef;

   private readonly renderer = inject(Renderer2);

  @ViewChild("buttonAnchor", { static: true })
  private buttonAnchor!: ElementRef<HTMLElement>;
  readonly steps = computed(() => {
    const inter = this.state.intervinientes();
    if (inter?.tomadorEsPropietario) {
      return USO_CONDUCTORES_STEPS.filter((s) => s.id !== "direccion-tomador");
    }
    return USO_CONDUCTORES_STEPS;
  });
  readonly activeIndex = signal(0);
  readonly activeStepId = computed(
    () => this.steps()[this.activeIndex()]?.id ?? null,
  );

  readonly nextEnabled = computed(() => {
    switch (this.activeStepId()) {
      case "uso-vehiculo":
        return this.state.canContinueFromUso();
      case "intervinientes": {
        const intervinientes = this.state.intervinientes();
        return (
          !intervinientes.tomadorEsPropietario ||
          this.state.canContinueFromIntervinientes()
        );
      }
      case "direccion-tomador":
        return this.isDireccionTomadorComplete();
      case "seguro-anterior":
        return this.state.canContinueFromSeguroAnterior();
      case "fecha-efecto-seguro":
         return true;
      default:
        return false;
    }
  });
readonly isLastStep = computed(() => {
  const steps = this.steps();
  return this.activeStepId() === steps[steps.length - 1].id;
});


  readonly allStepsCompleted = computed(() => {
    if (!this.state.canContinueFromUso()) return false;

    const inter = this.state.intervinientes();
    const tomadorEsPropietario = !!inter?.tomadorEsPropietario;

    if (!this.state.canContinueFromIntervinientes()) return false;

    if (!tomadorEsPropietario && !this.isDireccionTomadorComplete()) {
      return false;
    }

    if (!this.state.canContinueFromSeguroAnterior()) return false;
    if (!this.state.canContinueFromFechaEfectoSeguro()) return false;

    return true;
  });
  ngOnInit(): void {
    this.navService.activePageConfig.set({
      pageId: "uso-conductores",
      previousPageUrl: "/vehiculos/accesorios",
      previousPageLabel: "Vehículos",
      nextPageUrl: "/precio-coberturas",
      beforeNavigateNext: () => this.prepareToContinueToPricing(),
      canContinueNext: () => this.allStepsCompleted(),
    });
  }

  ngAfterViewInit(): void {
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd,
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.syncStepFromUrl());
    this.syncStepFromUrl();

    effect(
      () => {
        const inter = this.state.intervinientes();
        const tomadorEsPropietario = !!inter?.tomadorEsPropietario;
        const current = this.currentRouteStep;
        const direccionOriginalIndex = USO_CONDUCTORES_STEPS.findIndex(
          (s) => s.id === "direccion-tomador",
        );

        if (tomadorEsPropietario && direccionOriginalIndex >= 0) {

          if (this.state.stepsLoaded()[direccionOriginalIndex]) {
            this.state.clearStepLoaded(direccionOriginalIndex);
            this.destroyStepComponent("direccion-tomador");
          }

          const hasStaleDireccionTomador = untracked(() => {
            const direccion = this.state.direccionTomador();
            const hasValues = Object.values(direccion).some(
              (value) => value.trim().length > 0,
            );
            return (
              hasValues ||
              this.state.direccionTomadorCompleted() ||
              this.state.direccionTomadorFromGoogle()
            );
          });

          if (hasStaleDireccionTomador) {
            this.state.clearDireccionTomador();
          }

          if (current === "direccion-tomador") {
            this.state.setLastStep("intervinientes");
            this.navigateTo("intervinientes", true);
          }
        }
      },
      { injector: this.injector, allowSignalWrites: true },
    );
  }

  private stepIdFromUrl(): string | null {
    const segments =
      this.router
        .parseUrl(this.router.url)
        .root.children["primary"]?.segments.map((segment) => segment.path) ??
      [];

    return segments.length >= 2 ? segments[1] : null;
  }

  private get currentRouteStep(): string {
    return this.stepIdFromUrl() ?? this.steps()[0].id;
  }

  private async syncStepFromUrl(): Promise<void> {
    const stepId = this.currentRouteStep;

    if (stepId === "intervinientes" && !this.state.canContinueFromUso()) {
      this.navigateTo("uso-vehiculo", true);
      return;
    }

    const index = this.steps().findIndex((step) => step.id === stepId);

    if (index >= 0) {
      const originalIndex = USO_CONDUCTORES_STEPS.findIndex(
        (s) => s.id === stepId,
      );

      if (originalIndex >= 0) {
        this.state.setStepLoaded(originalIndex);
      }

      for (let i = 0; i < originalIndex; i++) {
        this.state.setStepLoaded(i);
      }
    }

    this.activeIndex.set(index);
    this.state.setLastStep(stepId);

    await this.loadStep(stepId);
    const steps = this.steps();
    const currentIndex = this.activeIndex();
    const nextStep = steps[currentIndex + 1];

   this.navService.activePageConfig.set({
  pageId: "uso-conductores",
  previousPageUrl: "/vehiculos/accesorios",
  previousPageLabel: "Vehículos",
  nextPageUrl: "/precio-coberturas",
  beforeNavigateNext: () => this.prepareToContinueToPricing(),
  canContinueNext: () => this.allStepsCompleted(),
});
  }


  private repositionNextButton(): void {
    const activeId = this.activeStepId();
    if (!activeId || !this.buttonAnchor) return;

    const activeRef = this.stepComponentRefs.get(activeId);
    if (!activeRef) return;

    const activeEl = activeRef.location.nativeElement as HTMLElement;
    const anchorEl = this.buttonAnchor.nativeElement;
    const parent = activeEl.parentElement;
    if (!parent) return;

    this.renderer.insertBefore(parent, anchorEl, activeEl.nextSibling);
  }

  async loadStep(stepId: string): Promise<void> {
    const currentSteps = this.steps();
    const index = currentSteps.findIndex((step) => step.id === stepId);
    if (index < 0) {
      return;
    }

    this.activeIndex.set(index);

    const loaded =
      this.state.stepsLoaded() ??
      new Array(USO_CONDUCTORES_STEPS.length).fill(false);

    for (let stepIndex = 0; stepIndex < currentSteps.length; stepIndex++) {
      const step = currentSteps[stepIndex];
      const originalIndex = USO_CONDUCTORES_STEPS.findIndex(
        (s) => s.id === step.id,
      );
      const shouldBeLoaded =
        (originalIndex >= 0 && loaded[originalIndex]) || step.id === stepId;

      if (!shouldBeLoaded) {
        continue;
      }

      const existingRef = this.stepComponentRefs.get(step.id);
      if (existingRef) {
        if (step.id === stepId) {
          this.activeStepInstance = existingRef.instance as ParentNextStep;
        }
        continue;
      }

      const componentType = await step.component();
      const refCreatedWhileAwaiting = this.stepComponentRefs.get(step.id);
      if (refCreatedWhileAwaiting) {
        if (step.id === stepId) {
          this.activeStepInstance =
            refCreatedWhileAwaiting.instance as ParentNextStep;
        }
        continue;
      }

      const insertIndex = this.computeInsertIndex(step.id, currentSteps);
      const componentRef = this.stepOutlet.createComponent(
        componentType as Type<any>,
        { index: insertIndex },
      );
      this.stepComponentRefs.set(step.id, componentRef);

      if (originalIndex >= 0) {
        this.state.setStepLoaded(originalIndex);
      }

      if (step.id === stepId) {
        this.activeStepInstance = componentRef.instance as ParentNextStep;
      }
    }

    this.repositionNextButton();

    if (this.activeStepInstance?.validate) {
      try {
        this.activeStepInstance.validate();
      } catch (e) {
      }
    }
  }


  private computeInsertIndex(
    stepId: string,
    currentSteps: StepDefinition[],
  ): number {
    const targetPos = currentSteps.findIndex((s) => s.id === stepId);
    let index = 0;
    for (let i = 0; i < targetPos; i++) {
      if (this.stepComponentRefs.has(currentSteps[i].id)) {
        index++;
      }
    }
    return index;
  }

  private destroyStepComponent(stepId: string): void {
    const ref = this.stepComponentRefs.get(stepId);
    if (ref) {
      ref.destroy();
      this.stepComponentRefs.delete(stepId);
    }
  }

  async goNext(): Promise<void> {
    if (!this.nextEnabled()) return;
    if (this.navigating) return;

    const index = this.activeIndex();
    const currentSteps = this.steps();
    const currentStep = currentSteps[index];
    if (!currentStep) return;

    if (this.activeStepInstance?.onParentNext?.()) {
      return;
    }

    const nextStep = currentSteps[index + 1];
    if (!nextStep) return;

    const nextOriginalIndex = USO_CONDUCTORES_STEPS.findIndex(
      (step) => step.id === nextStep.id,
    );
    if (nextOriginalIndex >= 0) {
      this.state.setStepLoaded(nextOriginalIndex);
    }
    this.state.setLastStep(nextStep.id);

    this.navigating = true;
    this.router.navigate(["/uso-conductores", nextStep.id]).finally(() => {
      this.navigating = false;
    });
  }

  private navigateTo(stepId: string, replaceUrl = false): void {
    this.router.navigate(["/uso-conductores", stepId], { replaceUrl });
  }

  private isDireccionTomadorComplete(): boolean {
    const direccion = this.state.direccionTomador();
    return [
      direccion.tipoVia,
      direccion.nombreVia,
      direccion.numero,
      direccion.codigoPostal,
      direccion.provincia,
      direccion.localidad,
    ].every((value) => value.trim().length > 0);
  }

  private async normalizeDireccionTomador(): Promise<boolean> {
    const step = this.stepComponentRefs.get("direccion-tomador")?.instance as DireccionTomadorStep | undefined;

    try {
      const normalizedAddress = await firstValueFrom(
        this.datosDomicilioService.normalizeAddress(this.state.direccionTomador()),
      );

      const addressData = await firstValueFrom(
        this.datosDomicilioService.getAddressData(normalizedAddress.codigoPostal),
      );
      const normalized = {
        ...normalizedAddress,
        provincia: addressData.provincia ?? addressData.provincias[0]?.value ?? normalizedAddress.provincia,
      };
      this.state.updateDireccionTomador(normalized);
      this.state.completeDireccionTomador();
      step?.applyNormalizedAddress?.(normalized);
      return true;
    } catch {
      step?.showNormalisationFailure?.();
      return false;
    }
  }

  private async prepareToContinueToPricing(): Promise<boolean> {
    const direccion = this.state.direccionTomador();
    const hasTomadorAddress = Object.values(direccion).some((value) => value.trim().length > 0);

    if (hasTomadorAddress && !this.isDireccionTomadorComplete()) {
      const step = this.stepComponentRefs.get("direccion-tomador")?.instance as DireccionTomadorStep | undefined;
      step?.showIncompleteAddress?.();
      return false;
    }

    if (hasTomadorAddress && !this.state.direccionTomadorCompleted()) {
      if (this.navigating) return false;
      this.navigating = true;
      const normalized = await this.normalizeDireccionTomador();
      this.navigating = false;
      if (!normalized) return false;

      await new Promise<void>((resolve) => setTimeout(resolve, 800));
    }

    return true;
  }

  onStepAreaInteraction(event: Event): void {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    for (const [stepId, ref] of this.stepComponentRefs.entries()) {
      const root = ref.location.nativeElement as HTMLElement;
      if (root.contains(target)) {
        if (stepId !== this.activeStepId()) {
          this.setActiveStepWithoutReload(stepId);
        }
        return;
      }
    }
  }

  private setActiveStepWithoutReload(stepId: string): void {
    const index = this.steps().findIndex((step) => step.id === stepId);
    if (index < 0) return;

    this.activeIndex.set(index);
    this.activeStepInstance =
      (this.stepComponentRefs.get(stepId)?.instance as ParentNextStep) ??
      null;
    this.state.setLastStep(stepId);
    this.repositionNextButton();
    this.navigateTo(stepId, true);
  }

  showToast(message: string, type: 'success' | 'info' | 'warning' | 'danger') {
  this.toastMessage.set(message);
  this.toastType.set(type);
  this.toastOpen.set(true);
}
  ngOnDestroy(): void {
    this.navService.activePageConfig.set(null);
    this.stepComponentRefs.clear();
  }
}

export interface StepDefinition {
  id: string;
  label: string;
  component: () => Promise<any>;
}

interface ParentNextStep {
  onParentNext?(): boolean;
  validate?(): void;
}

interface DireccionTomadorStep extends ParentNextStep {
  applyNormalizedAddress?(address: DatosDomicilioModel): void;
  showNormalisationFailure?(): void;
  showIncompleteAddress?(): void;
}
