import { AgentApi } from "../model/api/agent-api";
import { AgentDto } from "../model/dto/agent.dto";

export class AgentMapper {

  static toDto(
    source: AgentApi
  ): AgentDto {

    return {
      id: source.id,
      code: source.codigo,
      identification: source.identificacion,
      description: source.descripcion
    };
  }

  static toDtoList(
    source: AgentApi[]
  ): AgentDto[] {

    return source.map(
      item => AgentMapper.toDto(item)
    );
  }
}