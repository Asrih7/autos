export interface Persona {
  documento: string;
  numeroDocumento: string;
  pais: string;
  fechaNacimiento?: Date | null;
  tipoCarnet?: string | null;
  fechaObtencionCarnet?: Date | null;
  edadObtencionCarnet?: string | null;
}
