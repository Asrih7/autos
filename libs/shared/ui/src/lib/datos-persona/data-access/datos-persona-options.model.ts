export interface DatosPersonaOption {
  readonly value: string;
  readonly label: string;
}

export interface DatosPersonaOptions {
  readonly documentTypes: readonly DatosPersonaOption[];
  readonly nationalities: readonly DatosPersonaOption[];
}
