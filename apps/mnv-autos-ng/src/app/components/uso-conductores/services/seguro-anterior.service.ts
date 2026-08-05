import { Injectable } from "@angular/core";
import { GridItemSelector } from "@mnv-autos-ng/models";
import {
  SEGURO_ANTERIOR_OPCIONES,
  CATALOGO_SEGUROS,
  ANIOS_ASEGURADO_OPCIONES,
} from "../data/mock-seguro-anterior";
import { SeguroAnteriorOpcion, SelectOpcion } from "../models/seguro-anterior.model";

@Injectable({ providedIn: "root" })
export class SeguroAnteriorService {
  getOpciones(): SeguroAnteriorOpcion[] {
    return SEGURO_ANTERIOR_OPCIONES;
  }

  getCatalogoSeguros(): GridItemSelector[] {
    return CATALOGO_SEGUROS;
  }

  getAniosAseguradoOpciones(): SelectOpcion[] {
    return ANIOS_ASEGURADO_OPCIONES;
  }
}
