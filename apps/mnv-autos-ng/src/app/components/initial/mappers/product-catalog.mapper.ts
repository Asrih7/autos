

import { CollectiveApi, ProductApi, ProductApiResponse } from '../model/api/product-api';
import { CollectiveDto } from '../model/dto/collective.dto';
import { ProductDto } from '../model/dto/product.dto';

export class ProductMapper {

  private constructor() {}

  static toDto(
    source: ProductApi
  ): ProductDto {

    return {
      code: source.codigo,
      description: source.descripcion,
      collectives: source.combinacionComercial.map(
        collective =>
          ProductMapper.toCollectiveDto(
            collective
          )
      )
    };
  }

  static toDtoList(
    source: ProductApiResponse
  ): ProductDto[] {

    return source.productoTecnico.map(
      product =>
        ProductMapper.toDto(product)
    );
  }

  private static toCollectiveDto(
    source: CollectiveApi
  ): CollectiveDto {

    return {
      code: source.codigo,
      description: source.descripcion
    };
  }
}