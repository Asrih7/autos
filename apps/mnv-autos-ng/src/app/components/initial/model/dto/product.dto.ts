import { CollectiveDto } from "./collective.dto";


export interface ProductDto {
  code: string;
  description: string;
  collectives: CollectiveDto[];
}