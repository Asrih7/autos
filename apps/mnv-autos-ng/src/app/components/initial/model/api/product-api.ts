export interface ProductApiResponse {
  productoTecnico: ProductApi[];
}

export interface ProductApi {
  codigo: string;
  descripcion: string;
  combinacionComercial: CollectiveApi[];
}

export interface CollectiveApi {
  codigo: string;
  descripcion: string;
}