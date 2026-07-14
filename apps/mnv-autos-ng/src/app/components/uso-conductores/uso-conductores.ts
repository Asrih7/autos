import {
  AfterViewInit,
  Component,
  Type,
  effect,
  computed,
  inject,
  signal,
  ViewChild,
  ViewContainerRef,
  OnInit, // 🟢 ADDED
  OnDestroy, // 🟢 ADDED
  DestroyRef, // 🟢 ADDED
} from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { filter } from "rxjs";
import { BalButton } from "@baloise/ds-angular";
import { TranslateModule } from "@ngx-translate/core";

import { USO_CONDUCTORES_STEPS } from "./uso-conductores.steps";
import { UsoConductoresStateService } from "./uso-conductores-state.service";
import { PageNavigationService } from "@mnv-autos-ng/navigation"; // 🟢 ADDED
import { takeUntilDestroyed } from "@angular/core/rxjs-interop"; // 🟢 ADDED

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
  // 🟢 ADDED
  private readonly router = inject(Router);
  private readonly state = inject(UsoConductoresStateService);
  private readonly navService = inject(PageNavigationService); // 🟢 ADDED
  private readonly destroyRef = inject(DestroyRef); // 🟢 ADDED
  private navigating = false;
  private activeStepInstance: ParentNextStep | null = null;

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
    // 🟢 ADDED
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
        takeUntilDestroyed(this.destroyRef), // 🟢 ADDED FIX LEAKING PROBLEM
      )
      .subscribe(() => this.syncStepFromUrl());

    this.syncStepFromUrl();

    // Si se marca 'tomador es propietario' mientras el usuario está en la
    // página de dirección del tomador, volvemos automáticamente a intervinientes.
    effect(() => {
      const inter = this.state.intervinientes();
      const tomadorEsPropietario = !!inter?.tomadorEsPropietario;
      const current = this.currentRouteStep;
      const direccionOriginalIndex = USO_CONDUCTORES_STEPS.findIndex(
        (s) => s.id === "direccion-tomador",
      );
      if (tomadorEsPropietario && direccionOriginalIndex >= 0) {
        // Si marcamos tomador como propietario debemos eliminar cualquier carga
        // previa de la step 'direccion-tomador' y recargar el step actual sin ella.
        this.state.clearStepLoaded(direccionOriginalIndex);
        this.state.setLastStep("intervinientes");
        // limpiar y recargar el paso actual para remover el componente si estaba creado
        try {
          this.stepOutlet.clear();
        } catch {}
        void this.loadStep(this.currentRouteStep);
        // si el usuario estaba en la pantalla de direccion, forzamos navegación atrás
        if (current === "direccion-tomador") {
          this.navigateTo("intervinientes", true);
        }
      }
    });
  }

  private get currentRouteStep(): string {
    const segments =
      this.router
        .parseUrl(this.router.url)
        .root.children["primary"]?.segments.map((segment) => segment.path) ??
      [];

    if (segments.length >= 2) {
      return segments[1];
    }

    const last = this.state.lastStepId();
    if (last && this.steps().some((step) => step.id === last)) {
      return last;
    }

    return this.steps()[0].id;
  }

  private async syncStepFromUrl(): Promise<void> {
    const stepId = this.currentRouteStep;

    try {
      this.stepOutlet.clear();
    } catch (error) {
      console.warn("stepOutlet.clear() falló", error);
    }

    if (stepId === "intervinientes" && !this.state.canContinueFromUso()) {
      this.navigateTo("uso-vehiculo", true);
      return;
    }

    const index = this.steps().findIndex((step) => step.id === stepId);
    if (index < 0) {
      this.navigateTo(this.steps()[0].id, true);
      return;
    }

    this.activeIndex.set(index);
    this.activeStepInstance = null;
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
    this.activeStepInstance = null;

    // stepsLoaded is stored by the original static step ordering (USO_CONDUCTORES_STEPS)
    const loaded =
      this.state.stepsLoaded() ??
      new Array(USO_CONDUCTORES_STEPS.length).fill(false);

    for (let stepIndex = 0; stepIndex < currentSteps.length; stepIndex++) {
      const step = currentSteps[stepIndex];
      const originalIndex = USO_CONDUCTORES_STEPS.findIndex(
        (s) => s.id === step.id,
      );
      if (originalIndex >= 0 && loaded[originalIndex]) {
        const componentType = await step.component();
        const componentRef = this.stepOutlet.createComponent(
          componentType as Type<any>,
        );
        if (step.id === stepId) {
          this.activeStepInstance = componentRef.instance as ParentNextStep;
        }
      }
    }

    const currentStep = currentSteps[index];
    const currentOriginalIndex = USO_CONDUCTORES_STEPS.findIndex(
      (s) => s.id === currentStep.id,
    );
    if (currentOriginalIndex >= 0 && !loaded[currentOriginalIndex]) {
      const componentType = await currentStep.component();
      const componentRef = this.stepOutlet.createComponent(
        componentType as Type<any>,
      );
      this.activeStepInstance = componentRef.instance as ParentNextStep;
      this.state.setStepLoaded(currentOriginalIndex);
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

  // 🟢 ADDED
  ngOnDestroy(): void {
    this.navService.activePageConfig.set(null);
  }
}

export interface StepDefinition {
  id: string;
  label: string;
  component: () => Promise<any>;
}

interface ParentNextStep {
  // Devuelve true cuando el step consume el clic y debe permanecer visible.
  onParentNext?(): boolean;
}
