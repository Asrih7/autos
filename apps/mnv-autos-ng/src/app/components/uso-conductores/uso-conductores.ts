import { AfterViewInit, Component, computed, inject, signal, ViewChild, ViewContainerRef, Type } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { USO_CONDUCTORES_STEPS } from './uso-conductores.steps';

@Component({
  selector: 'app-uso-conductores',
  standalone: true,
  templateUrl: './uso-conductores.html',
  styleUrl: './uso-conductores.scss'
})
export class UsoConductoresComponent implements AfterViewInit {
  private router = inject(Router);

  @ViewChild('stepOutlet', { read: ViewContainerRef, static: true })
  private stepOutlet!: ViewContainerRef;

  readonly steps = USO_CONDUCTORES_STEPS;
  readonly activeIndex = signal(0);
  readonly currentStepValid = signal(false);

  readonly showNext = computed(() => this.activeIndex() < this.steps.length - 1);
  readonly nextEnabled = computed(() => this.currentStepValid() && this.showNext());

  ngAfterViewInit(): void {
    this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd)).subscribe(() => {
      this.syncStepFromUrl();
    });

    this.syncStepFromUrl();
  }

  private get currentRouteStep(): string {
    const segments = this.router.parseUrl(this.router.url).root.children['primary']?.segments.map(segment => segment.path) ?? [];
    return segments.length ? segments[segments.length - 1] : this.steps[0].id;
  }

  private syncStepFromUrl(): void {
    const stepId = this.currentRouteStep;
    const index = this.steps.findIndex(step => step.id === stepId);

    if (index < 0) {
      this.navigateTo(this.steps[0].id, true);
      return;
    }

    this.activeIndex.set(index);
    this.currentStepValid.set(false);
    this.loadStep(stepId);
  }

  async loadStep(stepId: string): Promise<void> {
    const index = this.steps.findIndex(step => step.id === stepId);
    if (index < 0) {
      return;
    }

    this.activeIndex.set(index);
    this.stepOutlet.clear();
    this.currentStepValid.set(false);

    for (let i = 0; i <= index; i++) {
      const step = this.steps[i];
      const componentType = await step.component();
      const componentRef = this.stepOutlet.createComponent(componentType as Type<any>);
      if (i === index) {
        this.bindStepOutputs(componentRef.instance);
      }
    }
  }

  private bindStepOutputs(instance: unknown): void {
    this.currentStepValid.set(false);

    const emitters = ['selected', 'intervinientesCompleted'];
    for (const emitterName of emitters) {
      const emitter = (instance as any)[emitterName];
      if (emitter?.subscribe) {
        emitter.subscribe(() => {
          this.currentStepValid.set(true);
        });
      }
    }
  }

  goNext(): void {
    if (!this.nextEnabled()) {
      return;
    }

    const nextIndex = Math.min(this.activeIndex() + 1, this.steps.length - 1);
    this.navigateTo(this.steps[nextIndex].id);
  }

  private navigateTo(stepId: string, replaceUrl = false): void {
    this.router.navigate(['/uso-conductores', stepId], { replaceUrl });
  }
}
