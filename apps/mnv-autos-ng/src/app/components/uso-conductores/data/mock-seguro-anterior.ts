import { GridItemSelector } from "@mnv-autos-ng/models";
import { SeguroAnteriorOpcion, SelectOpcion } from "./../models/seguro-anterior.model";

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
  { id: "ALZ", nombre: "Allianz", logo: "assets/logos/allianz.png" },
  { id: "AXA", nombre: "Axa", logo: "assets/logos/axa.png" },
  { id: "DIR", nombre: "Direct", logo: "assets/logos/direct.png" },
  { id: "FEN", nombre: "Fenix", logo: "assets/logos/fenix.png" },
  { id: "FIA", nombre: "Fiatc", logo: "assets/logos/fiatc.png" },
  { id: "GNS", nombre: "Genesis", logo: "assets/logos/genesis.png" },
  { id: "GRP", nombre: "Groupama", logo: "assets/logos/groupama.png" },
  { id: "LIB", nombre: "Liberty", logo: "assets/logos/liberty.png" },
  { id: "LDT", nombre: "Línea Directa", logo: "assets/logos/linea-directa.png" },
  { id: "MAP", nombre: "Mapfre", logo: "assets/logos/mapfre.png" },
  { id: "MMN", nombre: "Mutua Madrileña", logo: "assets/logos/mutua-madrilena.png" },
  { id: "PLY", nombre: "Pelayo", logo: "assets/logos/pelayo.png" },
  { id: "REA", nombre: "Reale", logo: "assets/logos/reale.png" },
  { id: "ZUR", nombre: "Zurich", logo: "assets/logos/zurich.png" },
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
