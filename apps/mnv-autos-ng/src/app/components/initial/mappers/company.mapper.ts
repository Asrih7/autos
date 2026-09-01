import { CompanyApi } from "../model/api/company-api";
import { CompanyDto } from "../model/dto/company.dto";

export class CompanyMapper {

  static toDto(
    source: CompanyApi
  ): CompanyDto {

    return {
      code: source.codigo,
      identification: source.identificacion,
      name: source.nombre
    };
  }

  static toDtoList(
    source: CompanyApi[]
  ): CompanyDto[] {

    return source.map(
      item => CompanyMapper.toDto(item)
    );
  }
}