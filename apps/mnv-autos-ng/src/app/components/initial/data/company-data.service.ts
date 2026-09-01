import { Injectable } from '@angular/core';

import {
  delay,
  Observable,
  of
} from 'rxjs';

import { CompanyMapper } from '../mappers/company.mapper';
import { CompanyApi } from '../model/api/company-api';
import { CompanyDto } from '../model/dto/company.dto';

@Injectable({
  providedIn: 'root'
})
export class CompanyDataService {

  private readonly companies:
    CompanyApi[] = [

      {
        codigo: 'C031',
        identificacion: 'A28013050',
        nombre: 'CASER'
      },

      {
        codigo: 'C787',
        identificacion: 'A12345678',
        nombre: 'CASER SEGUROS GENERALES'
      }
    ];


  findByAgent(
    agentId: string
  ): Observable<CompanyDto[]> {

    console.log(
      'Mock compañías para agente:',
      agentId
    );


    return of(
      CompanyMapper.toDtoList(
        this.companies
      )
    ).pipe(
      delay(200)
    );
  }
}