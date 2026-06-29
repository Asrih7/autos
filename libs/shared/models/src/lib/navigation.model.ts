import { Route } from '@angular/router';

export class Pantalla {

    codigo: string;
    descripcion: string;
    orden: string;
    path: string;

    constructor(codigo: string, descripcion: string, orden: string, path: string) {
        this.codigo = codigo;
        this.descripcion = descripcion;
        this.orden = orden;
        this.path = path;
    }
}


export interface PageStep {
    id: string;
    label: string;
}

export interface PageStepDefinition {
    id: string;
    label: string;
}

export interface AppPageDefinition {
    id: string;
    path: string;
    label: string;
    steps: PageStepDefinition[];
    showInMenu?: boolean;
    loadComponent?: Route['loadComponent'];
    canActivate?: Route['canActivate'];
}

export type StepValidatorMap = Record<string, () => boolean>;