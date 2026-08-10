import { Modalidad, ModalidadEditable } from "./modalidades.models";

export type EstadoEdicionGrupo = Record<string, ModalidadEditable>;

export type EstadoEdicionPagina = Record<string, EstadoEdicionGrupo>;

export interface PrecioCoberturasPageState {
    modalidades: Modalidad[];
}

export interface RecalcularModalidadEvent {
    codigoGrupo: string;
    modalidadVisible: Modalidad;
    modalidadActualizada: Modalidad;
}