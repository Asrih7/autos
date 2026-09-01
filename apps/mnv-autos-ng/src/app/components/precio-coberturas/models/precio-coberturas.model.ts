import { Modalidad, ModalidadEditable } from "./modalidades.models";

export type EstadoEdicionGrupo = Record<string, ModalidadEditable>;

export interface PrecioCoberturasPageState {
    modalidades: Modalidad[];
    fraccionamiento: string;
    numeroPlazasAseguradas: string;
    capitalesFallecimiento: string;
    capitalesInvalidez: string;
}

export interface RecalcularModalidadEvent {
    codigoGrupo: string;
    modalidadActualizada: Modalidad;
}

export interface PeriodoCobro {
    codigo: string;
    descripcion: string;
}

export interface DetalleGarantia {
    valor: string;
    indicadorDefecto: string | null;
}

export interface GarantiaOcupantes {
    numeroPlazasAseguradas: DetalleGarantia[];
    capitalesFallecimiento: DetalleGarantia[];
    capitalesInvalidez: DetalleGarantia[];
}