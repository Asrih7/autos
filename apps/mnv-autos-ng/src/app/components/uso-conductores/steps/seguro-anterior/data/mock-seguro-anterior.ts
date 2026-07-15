import { GridItemSelector } from "@mnv-autos-ng/models";
import { SeguroAnteriorOpcion, SelectOpcion } from "../models/seguro-anterior.model";

export const SEGURO_ANTERIOR_OPCIONES: SeguroAnteriorOpcion[] = [
  {
    key: "otra-compania",
    label: "",
  },
  {
    key: "helvetia-caser",
    label: "",
  },
  {
    key: "sin-seguro",
    label: "",
  },
];

export const CATALOGO_SEGUROS: GridItemSelector[] = [
  { id: "ALZ", nombre: "Allianz", logo: "assets/logos/Allianz.png" },
  { id: "AXA", nombre: "Axa", logo: "assets/logos/Axa.png" },
  {
    id: "CTO",
    nombre: "CatalanaOccidente",
    logo: "assets/logos/CatalanaOccidente.png",
  },
  { id: "GEN", nombre: "Generalli", logo: "assets/logos/Generalli.png" },
  { id: "GNS", nombre: "Genesis", logo: "assets/logos/Genesis.png" },
  {
    id: "LIB",
    nombre: "LibertySeguros",
    logo: "assets/logos/LibertySeguros.png",
  },
  { id: "MAP", nombre: "Mapfre", logo: "assets/logos/Mapfre.png" },
  {
    id: "MMN",
    nombre: "MutuaMadrileña",
    logo: "assets/logos/MutuaMadrileña.png",
  },
  { id: "PLY", nombre: "Pelayo", logo: "assets/logos/Pelayo.png" },
];

export const ANIOS_ASEGURADO_OPCIONES: SelectOpcion[] = [
  {
    label: "",
    value: "menos-1",
  },
  {
    label: "",
    value: "2",
  },
  {
    label: "",
    value: "3",
  },
  {
    label: "",
    value: "4",
  },
  {
    label: "",
    value: "mas-5",
  },
];
