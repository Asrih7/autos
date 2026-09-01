import { Cobertura, Modalidad } from "../models/modalidades.models";
import { DetalleGarantia, PeriodoCobro } from "../models/precio-coberturas.model";

export const coberturasIncluidasMock: Cobertura[] = [
    {
        codigo: 'RC1',
        descripcion: 'Responsabilidad civil de suscripción obligatoria',
        codigoRelacion: 'MOCK'
    },
    {
        codigo: 'RC2',
        descripcion: 'Responsabilidad civil voluntaria',
        codigoRelacion: 'MOCK'
    },
    {
        codigo: 'AC1',
        descripcion: 'Accidentes corporales',
        codigoRelacion: 'MOCK'
    },
    {
        codigo: 'SPJ',
        descripcion: 'Seguro de protección jurídica',
        codigoRelacion: 'MOCK'
    },
]

export const coberturasOpcionalesMock: Cobertura[] = [
    {
        codigo: 'ASIST',
        descripcion: 'Asistencia en viaje',
        contratada: false,
        codigoRelacion: 'MOCK'
    },
    {
        codigo: 'ATM',
        descripcion: 'Fenómenos atmosféricos',
        contratada: false,
        codigoRelacion: 'MOCK'
    },
    {
        codigo: 'ACC_COND',
        descripcion: 'Accidentes del conductor',
        contratada: false,
        codigoRelacion: 'MOCK'
    },
    {
        codigo: 'COL_ANI',
        descripcion: 'Daños por colisión con animal',
        contratada: false,
        codigoRelacion: 'MOCK'
    }
]

export const modalidadesMock: Modalidad[] = [
    {
        codigo: 'TERCERO_BASICO',
        descripcion: 'Tercero básico',
        orden: '1',
        agrupacion: {
            codigo: "TERCEROS",
            descripcion: "Terceros",
            codigoRelacion: "TERCEROS_BASICO"
        },
        primaTotal: 63.00,
        primerRecibo: 63.00,
        restoRecibos: 0,
        franquicia: null,
        coberturasIncluidas: coberturasIncluidasMock,
        coberturasOpcionales: structuredClone(coberturasOpcionalesMock),
        derogacion: false
    },
    {
        codigo: 'TERCERO_BASICO_LUNA',
        descripcion: 'Tercero básico + luna',
        orden: '2',
        agrupacion: {
            codigo: "TERCEROS",
            descripcion: "Terceros",
            codigoRelacion: "TERCERO_BASICO_LUNA"
        },
        primaTotal: 70.00,
        primerRecibo: 70.00,
        restoRecibos: 0,
        franquicia: null,
        coberturasIncluidas: coberturasIncluidasMock,
        coberturasOpcionales: structuredClone(coberturasOpcionalesMock),
        derogacion: false,
    },
    {
        codigo: 'TERCEROS_LUNAS_CXC',
        descripcion: 'Terceros + Lunas + CxC',
        orden: '3',
        agrupacion: {
            codigo: "TERCEROS_AUMENTADO",
            descripcion: "Terceros aumentado",
            codigoRelacion: "TERCEROS_LUNAS_CXC"
        },
        primaTotal: 180.00,
        primerRecibo: 180.00,
        restoRecibos: 0,
        franquicia: null,
        coberturasIncluidas: coberturasIncluidasMock,
        coberturasOpcionales: structuredClone(coberturasOpcionalesMock),
        derogacion: false
    },
    {
        codigo: 'TERCEROS_LUNAS_ROBO',
        descripcion: 'Terceros + Lunas + Robo',
        orden: '4',
        agrupacion: {
            codigo: "TERCEROS_AUMENTADO",
            descripcion: "Terceros aumentado",
            codigoRelacion: "TERCEROS_LUNAS_ROBO"
        },
        primaTotal: 0,
        primerRecibo: 0,
        restoRecibos: 0,
        franquicia: null,
        coberturasIncluidas: coberturasIncluidasMock,
        coberturasOpcionales: structuredClone(coberturasOpcionalesMock),
        derogacion: true
    },
    {
        codigo: 'RIESGO_300',
        descripcion: 'Riesgo con franquicia',
        orden: '5',
        agrupacion: {
            codigo: "TODO_RIESGO",
            descripcion: "A todo riesgo",
            codigoRelacion: "RIESGO_300"
        },
        primaTotal: 270.00,
        primerRecibo: 270.00,
        restoRecibos: 0,
        franquicia: 300,
        coberturasIncluidas: coberturasIncluidasMock,
        coberturasOpcionales: structuredClone(coberturasOpcionalesMock),
        derogacion: false
    },
    {
        codigo: 'RIESGO_600',
        descripcion: 'Riesgo con franquicia',
        orden: '5',
        agrupacion: {
            codigo: "TODO_RIESGO",
            descripcion: "A todo riesgo",
            codigoRelacion: "RIESGO_600"
        },
        primaTotal: 220.00,
        primerRecibo: 220.00,
        restoRecibos: 0,
        franquicia: 600,
        coberturasIncluidas: coberturasIncluidasMock,
        coberturasOpcionales: structuredClone(coberturasOpcionalesMock),
        derogacion: false
    },
    {
        codigo: 'RIESGO_900',
        descripcion: 'Riesgo con franquicia',
        orden: '5',
        agrupacion: {
            codigo: "TODO_RIESGO",
            descripcion: "A todo riesgo",
            codigoRelacion: "RIESGO_900"
        },
        primaTotal: 190.00,
        primerRecibo: 190.00,
        restoRecibos: 0,
        franquicia: 900,
        coberturasIncluidas: coberturasIncluidasMock,
        coberturasOpcionales: structuredClone(coberturasOpcionalesMock),
        derogacion: false
    },
    {
        codigo: 'RIESGO_0',
        descripcion: 'Riesgo sin franquicia',
        orden: '6',
        agrupacion: {
            codigo: "TODO_RIESGO",
            descripcion: "A todo riesgo",
            codigoRelacion: "RIESGO_0"
        },
        primaTotal: 300.00,
        primerRecibo: 300.00,
        restoRecibos: 0,
        franquicia: 0,
        coberturasIncluidas: coberturasIncluidasMock,
        coberturasOpcionales: structuredClone(coberturasOpcionalesMock),
        derogacion: false
    }
];

export const periodosCobroMock: PeriodoCobro[] = [{
    "codigo": "ANUA",
    "descripcion": "Anual"
}];

export const numeroPlazasAseguradasMock: DetalleGarantia[] = [{
    "valor": "1",
    "indicadorDefecto": null
}]

export const capitalesFallecimientoMock: DetalleGarantia[] = [{
    "valor": "30000",
    "indicadorDefecto": null
}]

export const capitalesInvalidezMock: DetalleGarantia[] = [{
    "valor": "30000",
    "indicadorDefecto": null
}]

export const defaultFraccionadoSeleccionado: string = "ANUA";
export const defaultNumeroPlazasSeleccionado: string = "1";
export const defaultCapitalesFallecimientoSeleccionado: string = "30000";
export const defaultCapitalesInvalidezSeleccionado: string = "30000";