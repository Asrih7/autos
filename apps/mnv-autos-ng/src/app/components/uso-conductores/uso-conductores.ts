import {
  AfterViewInit,
  Component,
  computed,
  inject,
  signal,
  ViewChild,
  ViewContainerRef,
  Type
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { USO_CONDUCTORES_STEPS } from './uso-conductores.steps';
import { BalButton } from '@baloise/ds-angular';
import { UsoConductoresStateService } from './uso-conductores-state.service';

@Component({
  selector: 'app-uso-conductores',
  standalone: true,
  imports: [BalButton],
  templateUrl: './uso-conductores.html',
  styleUrl: './uso-conductores.scss'
})
export class UsoConductoresComponent implements AfterViewInit {
  private router = inject(Router);
  private state = inject(UsoConductoresStateService);
  private navigating = false;

  @ViewChild('stepOutlet', { read: ViewContainerRef, static: true })
  private stepOutlet!: ViewContainerRef;

  readonly steps = USO_CONDUCTORES_STEPS;
  readonly activeIndex = signal(0);

  readonly boundSteps = computed(() => this.state.stepsLoaded());

  readonly stepValid = computed(() =>
    this.steps.map(step => {
      switch (step.id) {
        case 'uso-vehiculo':
          return this.state.canContinueFromUso();
        case 'intervinientes':
          return this.state.intervinientesCompleted();
        default:
          return true;
      }
    })
  );

  readonly showNext = computed(() => this.activeIndex() < this.steps.length - 1);
  readonly currentStepValid = computed(() => this.stepValid()[this.activeIndex()] ?? false);
  readonly nextEnabled = computed(() => this.currentStepValid() && this.showNext());

  ngAfterViewInit(): void {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => this.syncStepFromUrl());

    this.syncStepFromUrl();
  }

  private get currentRouteStep(): string {
    const segments = this.router.parseUrl(this.router.url)
      .root.children['primary']?.segments.map(s => s.path) ?? [];

    if (segments.length >= 2) return segments[1];

    const last = this.state.lastStepId();
    if (last && this.steps.some(s => s.id === last)) return last;

    return this.steps[0].id;
  }

  // syncStepFromUrl corregido
private async syncStepFromUrl(): Promise<void> {
  const stepId = this.currentRouteStep;

  // 1) limpiar outlet para evitar duplicados al reconstruir
  try {
    this.stepOutlet.clear();
  } catch (err) {
    // no bloquear si clear falla por alguna razón
    console.warn('stepOutlet.clear() falló', err);
  }

  // 2) validaciones de acceso: si la URL pide un step al que no se puede acceder,
  //    redirigimos al step correcto. No forzamos redirecciones si la URL ya es correcta.
  if (stepId === 'intervinientes' && !this.state.canContinueFromUso()) {
    // si el usuario no puede entrar a intervinientes, forzamos uso-vehiculo
    this.navigateTo('uso-vehiculo', true);
    return;
  }

  if (stepId === 'direccion-propietario' && !this.state.intervinientesCompleted()) {
    this.navigateTo('intervinientes', true);
    return;
  }

  // 3) resolver índice y proteger contra step inválido
  const index = this.steps.findIndex(s => s.id === stepId);
  if (index < 0) {
    this.navigateTo(this.steps[0].id, true);
    return;
  }

  // 4) establecer activeIndex inmediatamente para que las computeds usen el step correcto
  this.activeIndex.set(index);
  this.state.setLastStep(stepId);

  // 5) delegar toda la creación/reconstrucción a loadStep
  await this.loadStep(stepId);
}

// loadStep centralizado y seguro
async loadStep(stepId: string): Promise<void> {
  const index = this.steps.findIndex(step => step.id === stepId);
  if (index < 0) return;

  // asegurar activeIndex
  this.activeIndex.set(index);

  // obtener array de steps cargados (fallback seguro)
  const loaded = this.state.stepsLoaded() ?? new Array(this.steps.length).fill(false);

  // reconstruir todos los steps que el state indica como cargados
  for (let i = 0; i < loaded.length; i++) {
    if (loaded[i]) {
      const step = this.steps[i];
      const componentType = await step.component();
      this.stepOutlet.createComponent(componentType as Type<any>);
    }
  }

  // si el step actual no estaba marcado como cargado, lo creamos y lo marcamos
  if (!loaded[index]) {
    const step = this.steps[index];
    const componentType = await step.component();
    this.stepOutlet.createComponent(componentType as Type<any>);
    this.state.setStepLoaded(index);
  }
}



goNext(): void {
  if (!this.nextEnabled()) return;
  if (this.navigating) return;

  const nextIndex = Math.min(this.activeIndex() + 1, this.steps.length - 1);
  const nextStepId = this.steps[nextIndex].id;

  // marcar el siguiente step como cargado antes de navegar
  this.state.setStepLoaded(nextIndex);
  this.state.setLastStep(nextStepId);

  // proteger contra reentradas
  this.navigating = true;
  this.router.navigate(['/uso-conductores', nextStepId])
    .finally(() => { this.navigating = false; });
}



  private navigateTo(stepId: string, replaceUrl = false): void {
    this.router.navigate(['/uso-conductores', stepId], { replaceUrl });
  }
}
