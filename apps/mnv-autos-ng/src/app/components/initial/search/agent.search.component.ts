import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  output,
  signal
} from '@angular/core';

import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  of,
  Subject,
  switchMap
} from 'rxjs';

import {
  takeUntilDestroyed
} from '@angular/core/rxjs-interop';

import {
  BalField,
  BalFieldLabel,
  BalInput,
  BalSpinner,
  parseCustomEvent
} from '@baloise/ds-angular';

import {
  AgentDataService
} from '../data/agent-data.service';

import {
  AgentDto
} from '../model/dto/agent.dto';

import { TranslateModule } from '@ngx-translate/core';
@Component({
  selector: 'app-agent-search',
  standalone: true,

  imports: [
    BalField,
    BalInput,
    BalSpinner,
    TranslateModule
  ],

  templateUrl: './agent.search.component.html',
  styleUrl: './agent.search.component.scss',

  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AgentSearchComponent {

  private readonly agentDataService =
    inject(AgentDataService);

  private readonly destroyRef =
    inject(DestroyRef);

  /**
   * Flujo de términos introducidos
   * por el usuario.
   */
  private readonly searchSubject =
    new Subject<string>();


  /**
   * Resultados de búsqueda.
   */
  readonly agents =
    signal<AgentDto[]>([]);


  /**
   * Indica que se está realizando
   * una búsqueda.
   */
  readonly loading =
    signal(false);


  /**
   * Controla la visibilidad del
   * panel de resultados.
   */
  readonly opened =
    signal(false);


  /**
   * Agente actualmente seleccionado.
   */
  readonly selectedAgent =
    signal<AgentDto | null>(null);


  /**
   * Evento que recibe InicialComponent.
   */
  readonly agentSelected =
    output<AgentDto>();

  readonly searchValue = signal('');

  constructor() {
    this.initializeSearch();
  }


  /**
   * Inicializa el flujo RxJS
   * utilizado para buscar agentes.
   */
  private initializeSearch(): void {

    this.searchSubject
      .pipe(

        /**
         * Esperamos a que el usuario
         * deje de escribir.
         */
        debounceTime(300),

        /**
         * No repetimos una búsqueda
         * con exactamente el mismo texto.
         */
        distinctUntilChanged(),

        /**
         * switchMap cancela conceptualmente
         * la búsqueda anterior cuando
         * llega una nueva.
         */
        switchMap(search => {

          this.loading.set(true);

          return this.agentDataService
            .search(search)
            .pipe(

              catchError(() => {

                this.agents.set([]);

                return of([]);
              }),

              finalize(() => {

                this.loading.set(false);
              })
            );
        }),

        /**
         * Destruye automáticamente
         * la suscripción con el componente.
         */
        takeUntilDestroyed(
          this.destroyRef
        )
      )
      .subscribe(agents => {

        this.agents.set(agents);

        this.opened.set(
          agents.length > 0
        );
      });
  }


  /**
   * Evento procedente de bal-input.
   */


protected onSearch(event: Event): void {
  const parsed = parseCustomEvent(event);

  const search: string = typeof parsed === 'string' ? parsed : '';


    this.searchValue.set(search);

    /**
     * Si modifica el texto después
     * de haber seleccionado un agente,
     * invalidamos esa selección.
     */
    this.selectedAgent.set(null);


    /**
     * No buscamos hasta disponer
     * de al menos 2 caracteres.
     */
    if (search.length < 2) {

      this.agents.set([]);

      this.opened.set(false);

      return;
    }


    this.searchSubject.next(search);
  }


  /**
   * Selección de un agente de
   * los resultados.
   */
  protected selectAgent(
    agent: AgentDto
  ): void {

    this.selectedAgent.set(agent);

    this.searchValue.set(
        this.getAgentLabel(agent)
    );

    this.agents.set([]);

    this.opened.set(false);

    this.agentSelected.emit(agent);
  }


  /**
   * Texto principal mostrado
   * para un agente.
   */
  protected getAgentLabel(
    agent: AgentDto
  ): string {

    return (
      `${agent.code} - ` +
      `${agent.description}`
    );
  }
}