export interface Cobertura {
    codigo: string;
    descripcion: string;
    contratada?: boolean;
    codigoRelacion: string;
}

export interface Agrupacion {
    codigo: string;
    descripcion: string;
    orden?: string;                         // De momento lo ignoramos
    codigoRelacion: string;
}

export interface Modalidad {
    codigo: string;
    descripcion: string;
    orden: string;
    agrupacion: Agrupacion;
    primaTotal: number;
    primerRecibo: number;
    restoRecibos: number;

    franquicia: number | null;
    derogacion: boolean;                    // Este me lo inventé

    coberturasIncluidas: Cobertura[];
    coberturasOpcionales: Cobertura[];

    modalidadesFranquicia?: Modalidad[];    // Para el caso de TODO_RIESGO
    seleccionada?: boolean;                 // Para el caso de TODO_RIESGO
}

export interface GrupoModalidades {
    titulo: string;
    codigo: string;
    modalidades: Modalidad[];
}

export interface CoberturaEditable {
    codigo: string;
    contratada: boolean;
}

export interface ModalidadEditable {
    codigoModalidad: string;
    franquiciaSeleccionada: number | null;
    coberturas: CoberturaEditable[];
    pendienteRecalculo: boolean;
}