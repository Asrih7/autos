import {
  AfterViewInit,
  Component,
  Type,
  ComponentRef,
  effect,
  computed,
  inject,
  signal,
  ViewChild,
  ViewContainerRef,
  OnInit,
  OnDestroy,
  DestroyRef,
  Injector, // 🔥 FIX NG0203
} from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { filter } from "rxjs";
import { BalButton } from "@baloise/ds-angular";
import { TranslateModule } from "@ngx-translate/core";

import { USO_CONDUCTORES_STEPS } from "./uso-conductores.steps";
import { UsoConductoresStateService } from "./uso-conductores-state.service";
import { PageNavigationService } from "@mnv-autos-ng/navigation";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
  selector: "app-uso-conductores",
  standalone: true,
  imports: [BalButton, TranslateModule],
  templateUrl: "./uso-conductores.html",
  styleUrl: "./uso-conductores.scss",
})
export class UsoConductoresComponent
  implements AfterViewInit, OnInit, OnDestroy
{
  private readonly router = inject(Router);
  private readonly state = inject(UsoConductoresStateService);
  private readonly navService = inject(PageNavigationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector); // 🔥 FIX NG0203
  private navigating = false;
  private activeStepInstance: ParentNextStep | null = null;
  private readonly stepComponentRefs = new Map<string, ComponentRef<any>>();

  @ViewChild("stepOutlet", { read: ViewContainerRef, static: true })
  private stepOutlet!: ViewContainerRef;

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
        return this.state.canContinueFromDireccionTomador();
      case "seguro-anterior":
        return this.state.canContinueFromSeguroAnterior();
      case "fecha-efecto-seguro":
        return this.state.canContinueFromFechaEfectoSeguro();
      default:
        return false;
    }
  });

  ngOnInit(): void {
    this.navService.activePageConfig.set({
      pageId: "uso-conductores",
      previousPageUrl: "/vehiculos/accesorios",
      previousPageLabel: "Vehículos",
      nextPageUrl: "/precio-coberturas",
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

          // si el usuario estaba en la pantalla de direccion, forzamos navegación atrás
          if (current === "direccion-tomador") {
            this.state.setLastStep("intervinientes");
            this.navigateTo("intervinientes", true);
          }
        }
      },
      { injector: this.injector, allowSignalWrites: true },
    );
  }

  /** Devuelve el id del step presente en la URL actual, o null si no hay segundo segmento. */
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
    console.log("[syncStepFromUrl] router.url:", this.router.url, "-> stepId:", stepId);

    if (stepId === "intervinientes" && !this.state.canContinueFromUso()) {
      this.navigateTo("uso-vehiculo", true);
      return;
    }

    const index = this.steps().findIndex((step) => step.id === stepId);

    if (index >= 0) {
      const originalIndex = USO_CONDUCTORES_STEPS.findIndex(
        (s) => s.id === stepId,
      );

      // Marca este step como loaded
      if (originalIndex >= 0) {
        this.state.setStepLoaded(originalIndex);
      }

      // Marca todos los steps anteriores como loaded
      for (let i = 0; i < originalIndex; i++) {
        this.state.setStepLoaded(i);
      }
    }

    this.activeIndex.set(index);
    this.state.setLastStep(stepId);

    await this.loadStep(stepId);
  }

  async loadStep(stepId: string): Promise<void> {
    const currentSteps = this.steps();
    const index = currentSteps.findIndex((step) => step.id === stepId);
    if (index < 0) {
      return;
    }

    this.activeIndex.set(index);

    // stepsLoaded se guarda según el orden original USO_CONDUCTORES_STEPS
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
        // Ya existe: lo dejamos tal cual, no lo tocamos.
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

      const componentRef = this.stepOutlet.createComponent(
        componentType as Type<any>,
      );
      this.stepComponentRefs.set(step.id, componentRef);

      if (originalIndex >= 0) {
        this.state.setStepLoaded(originalIndex);
      }

      if (step.id === stepId) {
        this.activeStepInstance = componentRef.instance as ParentNextStep;
      }
    }

    if (this.activeStepInstance?.validate) {
      try {
        this.activeStepInstance.validate();
      } catch (e) {
        console.warn("Error forcing validation:", e);
      }
    }
  }

  /** Destruye el componente de un step específico y lo saca del tracking. */
  private destroyStepComponent(stepId: string): void {
    const ref = this.stepComponentRefs.get(stepId);
    if (ref) {
      ref.destroy();
      this.stepComponentRefs.delete(stepId);
    }
  }

  goNext(): void {
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
    this.navigateTo(stepId, true);
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