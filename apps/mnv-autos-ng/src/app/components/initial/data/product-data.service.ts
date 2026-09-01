import {
  inject,
  Injectable
} from '@angular/core';

import {
  HttpClient,
  HttpHeaders,
  HttpParams
} from '@angular/common/http';

import {
  map,
  Observable
} from 'rxjs';


import {
  ProductDto
} from '../model/dto/product.dto';
import { ProductApiResponse } from '../model/api/product-api';
import { ProductMapper } from '../mappers/product-catalog.mapper';
import { environment } from './../../../../../../../apps/mnv-autos-ng/src/environments/environment';


@Injectable({
  providedIn: 'root'
})
export class ProductDataService {

  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiPaths.autos;
  
  
  getProducts(
  ): Observable<ProductDto[]> {

    
  const headers = new HttpHeaders({
    'lineaNegocio': 'AU02',
    'codigoMediador': '323232'
  });

    return this.http
      .get<ProductApiResponse>(
        `${this.apiUrl}/configuracion/productos`,
        {
          headers
        }
      )
      .pipe(
        map(response =>
          ProductMapper.toDtoList(
            response
          )
        )
      );
  }
}