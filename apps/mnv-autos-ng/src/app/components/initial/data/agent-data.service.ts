import { Injectable } from '@angular/core';

import {
  delay,
  Observable,
  of
} from 'rxjs';
import { AgentApi } from '../model/api/agent-api';
import { AgentDto } from '../model/dto/agent.dto';
import { AgentMapper } from '../mappers/agente.mapper';


@Injectable({
  providedIn: 'root'
})
export class AgentDataService {

  private readonly agents: AgentApi[] = [
    {
      id: '1',
      codigo: '001',
      identificacion: '12345678A',
      descripcion: 'AGENTE PRINCIPAL'
    },
    {
      id: '2',
      codigo: '002',
      identificacion: '87654321B',
      descripcion: 'SANTOS QUINTANA'
    },
    {
      id: '3',
      codigo: '003',
      identificacion: '99999999C',
      descripcion: 'SEDE SOCIAL'
    }
  ];


  search(
    search: string
  ): Observable<AgentDto[]> {

    const term =
      search
        .trim()
        .toLocaleLowerCase();


    const result =
      this.agents.filter(agent =>

        agent.codigo
          .toLocaleLowerCase()
          .includes(term)

        ||

        agent.identificacion
          .toLocaleLowerCase()
          .includes(term)

        ||

        agent.descripcion
          .toLocaleLowerCase()
          .includes(term)

      );


    return of(
      AgentMapper.toDtoList(result)
    ).pipe(
      delay(300)
    );
  }
}