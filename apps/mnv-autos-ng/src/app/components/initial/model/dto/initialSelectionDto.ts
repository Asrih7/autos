export interface SelectGenericto {
  id: string;
  description: string;
}

export interface InitialSelectionDto {
  agent: SelectGenericto;
  company: SelectGenericto;
  product: SelectGenericto;
  collective: SelectGenericto;
}