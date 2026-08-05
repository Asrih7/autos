export interface Cobertura {
    codigo: string;
    descripcion: string;
    contratada?: boolean;
    codigoRelacion: string;
}

export interface Agrupacion {
    codigo: string;
    descripcion: string;
    orden?: string;     // De momento lo ignoramos
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

    franquicia: string | null;
    derogacion: boolean;    // Este me lo inventé

    coberturasIncluidas: Cobertura[];
    coberturasOpcionales: Cobertura[];
}

export interface GrupoModalidades {
    titulo: string;
    modalidades: Modalidad[];
}