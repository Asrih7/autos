import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { NgComponentOutlet } from '@angular/common';
import { UsoConductoresStateService } from './uso-conductores-state.service';

@Component({
  selector: 'app-uso-conductores',
  standalone: true,
  imports: [NgComponentOutlet],
  templateUrl: './uso-conductores.html',
  styleUrl: './uso-conductores.scss'
})
export class UsoConductoresComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private stateService = inject(UsoConductoresStateService);

  steps = [
    {
      id: 'uso-vehiculo',
      component: () =>
        import('./steps/uso-vehiculo/uso-vehiculo')
          .then(m => m.UsoVehiculoComponent),
    },
    {
      id: 'intervinientes',
      component: () =>
        import('./steps/intervinientes/intervinientes')
          .then(m => m.IntervinientesComponent),
    },
    {
      id: 'direccion-propietario',
      component: () =>
        import('./steps/intervinientes/components/direccion-tomador/direccion-tomador.component')
          .then(m => m.DireccionTomadorComponent),
    }
  ];

  currentComponents = signal<any[]>([]);

  constructor() {
    this.route.params.subscribe((params: Params) => {
      const step = params['step'];
      if (!step || step === ':step') {
        this.router.navigate(['/uso-conductores', 'uso-vehiculo'], { replaceUrl: true });
        return;
      }
      this.loadStep(step);
    });

    this.stateService.usoSelected$.subscribe(() => {
      this.navigateTo('intervinientes');
    });

    this.stateService.intervinientesCompleted$.subscribe(() => {
      this.navigateTo('direccion-propietario');
    });
  }

  navigateTo(stepId: string) {
    this.router.navigate(['/uso-conductores', stepId]);
  }

  async loadStep(stepId: string) {
    const index = this.steps.findIndex(s => s.id === stepId);
    const componentsToLoad = [];
    for (let i = 0; i <= index; i++) {
      const cmp = await this.steps[i].component();
      componentsToLoad.push(cmp);
    }
    this.currentComponents.set(componentsToLoad);
  }
}