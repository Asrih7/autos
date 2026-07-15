import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  QueryList,
  SimpleChanges,
  ViewChildren,
  computed,
  inject,
  signal,
} from "@angular/core";
import {
  BalButton,
  BalInput,
  BalRadio,
  BalRadioGroup,
  BalSelect,
  BalSelectOption,
  BalHeading
} from "@baloise/ds-angular";

import { TranslateModule, TranslateService } from "@ngx-translate/core";

import { UsoConductoresStateService } from "../../uso-conductores-state.service";
import { SeguroAnteriorService } from "./../../services/seguro-anterior.service";
import { DataGridSelector } from "@mnv-autos-ng/ui";
import { GridItemSelector } from "@mnv-autos-ng/models";
import { SeguroAnteriorOpcion, SelectOpcion } from "./../../models/seguro-anterior.model";

@Component({
  selector: "app-seguro-anterior",
  standalone: true,
  imports: [
    BalButton,
    BalInput,
    BalRadio,
    BalRadioGroup,
    BalSelect,
    BalSelectOption,
    DataGridSelector,
    TranslateModule,
    BalHeading
  ],
  templateUrl: "./seguro-anterior.html",
  styleUrl: "./seguro-anterior.scss",
})
export class SeguroAnteriorComponent implements OnChanges, OnInit {
  private readonly usoState = inject(UsoConductoresStateService);
  private readonly translate = inject(TranslateService);
  private readonly seguroAnteriorService = inject(SeguroAnteriorService);
@Output() stepSelected = new EventEmitter<string>();
  @ViewChildren("digitoPolizaInput")
  private digitoPolizaInputs!: QueryList<BalInput>;

  @Input() valorInicial: string | null = null;

  @Output() seguroAnteriorChange = new EventEmitter<SeguroAnteriorOpcion>();

  protected readonly opciones: SeguroAnteriorOpcion[] = this.seguroAnteriorService.getOpciones();

  readonly aseguradoraSeleccionadaId = signal<string | null>(null);
  protected readonly aseguradoraConfirmada = signal(false);
  readonly catalogoSeguros = signal<GridItemSelector[]>(
    this.seguroAnteriorService.getCatalogoSeguros(),
  );

  protected readonly seguroSeleccionadoKey = signal("");
  protected readonly digitosPoliza = [0, 1, 2, 3, 4];
  protected readonly ultimosDigitosPoliza = signal<string[]>(Array(5).fill(""));
  protected readonly polizaConfirmada = signal(false);
  protected readonly continuarSinPoliza = signal(false);
  protected readonly aniosAseguradoSeleccionado = signal("");
  protected readonly siniestroSeleccionado = signal("");

  protected readonly aniosAseguradoOpciones: SelectOpcion[] =
    this.seguroAnteriorService.getAniosAseguradoOpciones();
  protected readonly siniestroOpciones: SelectOpcion[] = [
    {
      label: "",
      value: "si",
    },
    {
      label: "",
      value: "no",
    },
  ];

  protected readonly esOtraCompania = computed(
    () => this.seguroSeleccionadoKey() === "otra-compania",
  );
  protected readonly esFlujoCorto = computed(() =>
    ["helvetia-caser", "sin-seguro"].includes(this.seguroSeleccionadoKey()),
  );

  protected readonly mostrarSeccionIntermedia = computed(() =>
    this.esOtraCompania(),
  );
  protected readonly mostrarPolizaActual = computed(
    () =>
      this.esOtraCompania() &&
      !!this.aseguradoraSeleccionadaId() &&
      this.aseguradoraConfirmada(),
  );
  protected readonly polizaCompleta = computed(() =>
    this.ultimosDigitosPoliza().every((digito) => digito !== ""),
  );
  protected readonly datosPolizaConfirmados = computed(() =>
    this.polizaConfirmada(),
  );
  protected readonly mostrarAniosAsegurado = computed(
    () => this.mostrarPolizaActual() && this.datosPolizaConfirmados(),
  );
  protected readonly aniosAseguradoCompleto = computed(
    () => this.aniosAseguradoSeleccionado() !== "",
  );
  protected readonly mostrarSiniestro = computed(
    () => this.mostrarAniosAsegurado() && this.aniosAseguradoCompleto(),
  );
  protected readonly siniestroCompleto = computed(
    () => this.siniestroSeleccionado() !== "",
  );

  protected readonly seguroAnteriorCompleto = computed(() => {
    if (!this.seguroSeleccionadoKey()) {
      return false;
    }

    if (this.esFlujoCorto()) {
      return true;
    }

    return (
      !!this.aseguradoraSeleccionadaId() &&
      this.aseguradoraConfirmada() &&
      this.datosPolizaConfirmados() &&
      this.aniosAseguradoCompleto() &&
      this.siniestroCompleto()
    );
  });

  public onParentNext(): boolean {
    if (!this.esOtraCompania()) {
      return false;
    }

    if (this.aseguradoraSeleccionadaId() && !this.aseguradoraConfirmada()) {
      this.aseguradoraConfirmada.set(true);
      this.persistSeguroAnteriorState();
      return true;
    }

    if (!this.datosPolizaConfirmados() && this.polizaCompleta()) {
      this.confirmarPoliza();
      return true;
    }

    return false;
  }

  ngOnInit(): void {
    this.applyTranslations();
    this.translate.onLangChange.subscribe(() => this.applyTranslations());
    const saved = this.usoState.seguroAnterior();

    if (saved.seguroSeleccionadoKey) {
      this.seguroSeleccionadoKey.set(saved.seguroSeleccionadoKey);
      this.aseguradoraSeleccionadaId.set(saved.aseguradoraSeleccionadaId);
      this.aseguradoraConfirmada.set(saved.aseguradoraConfirmada);
      this.ultimosDigitosPoliza.set(
        this.normalizarDigitosPoliza(saved.ultimosDigitosPoliza),
      );
      this.polizaConfirmada.set(saved.polizaConfirmada);
      this.continuarSinPoliza.set(saved.continuarSinPoliza);
      this.aniosAseguradoSeleccionado.set(saved.aniosAseguradoSeleccionado);
      this.siniestroSeleccionado.set(saved.siniestroSeleccionado);
    } else {
      this.aplicarValorInicial();
    }

    this.persistSeguroAnteriorState();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["valorInicial"] && !changes["valorInicial"].firstChange) {
      this.aplicarValorInicial();
      this.persistSeguroAnteriorState();
    }
  }

  protected onSeguroAnteriorChange(value: unknown): void {
    const siguienteValor = this.readInputValue(value);

    // Always reset the flow when changing selection, even if same option clicked again
    this.seguroSeleccionadoKey.set(siguienteValor);
    this.resetSeguroAnteriorFlow();

    const opcion = this.opciones.find(
      (item) => item.key === this.seguroSeleccionadoKey(),
    );

    if (opcion) {
      this.seguroAnteriorChange.emit(opcion);
    }

    this.persistSeguroAnteriorState();
  }

  protected seleccionarSeguro(key: string): void {
      this.stepSelected.emit('seguro-anterior');
    this.onSeguroAnteriorChange(key);
  }

  protected onAseguradoraChange(id: string | null): void {
    if (id !== this.aseguradoraSeleccionadaId()) {
      this.aseguradoraConfirmada.set(false);
      this.polizaConfirmada.set(false);
      this.aniosAseguradoSeleccionado.set("");
      this.siniestroSeleccionado.set("");
    }

    this.aseguradoraSeleccionadaId.set(id);
    this.persistSeguroAnteriorState();
  }

  protected onDigitoPolizaInput(event: unknown, index: number): void {
    const digito = this.readInputValue(event).replace(/\D/g, "").slice(-1);

    this.ultimosDigitosPoliza.update((digitos) =>
      digitos.map((valor, currentIndex) =>
        currentIndex === index ? digito : valor,
      ),
    );
    this.continuarSinPoliza.set(false);

    if (!this.polizaCompleta()) {
      this.polizaConfirmada.set(false);
      this.aniosAseguradoSeleccionado.set("");
      this.siniestroSeleccionado.set("");
    }

    this.persistSeguroAnteriorState();

    if (digito && index < this.ultimosDigitosPoliza().length - 1) {
      this.enfocarSiguienteDigito(index);
    }
  }

  protected confirmarPoliza(): void {
    if (!this.polizaCompleta()) {
      return;
    }

    this.polizaConfirmada.set(true);
    this.continuarSinPoliza.set(false);
    this.persistSeguroAnteriorState();
  }

  protected continuarSinNumeroPoliza(): void {
    this.ultimosDigitosPoliza.set(Array(5).fill("0"));
    this.continuarSinPoliza.set(false);

    this.persistSeguroAnteriorState();
  }

  protected onAniosAseguradoChange(event: unknown): void {
    this.aniosAseguradoSeleccionado.set(this.readInputValue(event));
    this.persistSeguroAnteriorState();
  }

  protected onSiniestroChange(event: unknown): void {
    this.siniestroSeleccionado.set(this.readInputValue(event));
    this.persistSeguroAnteriorState();
  }

  private aplicarValorInicial(): void {
    this.seguroSeleccionadoKey.set(
      this.opciones.find((opcion) => opcion.key === this.valorInicial)?.key ??
        "",
    );
  }

  private persistSeguroAnteriorState(): void {
    this.usoState.updateSeguroAnteriorState({
      seguroSeleccionadoKey: this.seguroSeleccionadoKey(),
      aseguradoraSeleccionadaId: this.aseguradoraSeleccionadaId(),
      aseguradoraConfirmada: this.aseguradoraConfirmada(),
      ultimosDigitosPoliza: this.ultimosDigitosPoliza(),
      polizaConfirmada: this.polizaConfirmada(),
      continuarSinPoliza: this.continuarSinPoliza(),
      aniosAseguradoSeleccionado: this.aniosAseguradoSeleccionado(),
      siniestroSeleccionado: this.siniestroSeleccionado(),
      completed: this.seguroAnteriorCompleto(),
    });
  }

  private normalizarDigitosPoliza(
    digitos: string[] | null | undefined,
  ): string[] {
    const normalizados = Array(5).fill("");

    (digitos ?? []).slice(0, 5).forEach((digito, index) => {
      normalizados[index] = String(digito ?? "")
        .replace(/\D/g, "")
        .slice(-1);
    });

    return normalizados;
  }

  private readInputValue(event: unknown): string {
    const source = event as any;
    const value =
      source?.detail?.value ??
      source?.detail ??
      source?.target?.value ??
      source ??
      "";

    if (typeof value === "object" && value !== null && "value" in value) {
      return String(value.value ?? "");
    }

    return String(value);
  }

  private resetSeguroAnteriorFlow(): void {
  this.aseguradoraSeleccionadaId.set(null);
  this.aseguradoraConfirmada.set(false);
  this.ultimosDigitosPoliza.set(Array(5).fill(""));
  this.polizaConfirmada.set(false);
  this.continuarSinPoliza.set(false);
  this.aniosAseguradoSeleccionado.set("");
  this.siniestroSeleccionado.set("");

  this.usoState.updateSeguroAnteriorState({
    aseguradoraSeleccionadaId: null,
    aseguradoraConfirmada: false,
    ultimosDigitosPoliza: Array(5).fill(""),
    polizaConfirmada: false,
    continuarSinPoliza: false,
    aniosAseguradoSeleccionado: "",
    siniestroSeleccionado: "",
    completed: this.seguroAnteriorCompleto(), 
  });

  this.usoState.setStepLoaded(3); 
}


  private applyTranslations(): void {
    const t = (key: string) => this.translate.instant(key);

    const opcionesMap = {
      "otra-compania": "usoConductores.seguroAnterior.options.otraCompania",
      "helvetia-caser": "usoConductores.seguroAnterior.options.helvetiaCaser",
      "sin-seguro": "usoConductores.seguroAnterior.options.sinSeguro",
    } as const;

    this.opciones.forEach((op) => {
      op.label = t(opcionesMap[op.key as keyof typeof opcionesMap]);
    });

    const aniosMap: Record<string, string> = {
      "menos-1": "usoConductores.seguroAnterior.aniosAsegurado.options.menos1",
      "2": "usoConductores.seguroAnterior.aniosAsegurado.options.2",
      "3": "usoConductores.seguroAnterior.aniosAsegurado.options.3",
      "4": "usoConductores.seguroAnterior.aniosAsegurado.options.4",
      "mas-5": "usoConductores.seguroAnterior.aniosAsegurado.options.mas5",
    };

    this.aniosAseguradoOpciones.forEach((op) => {
      op.label = t(aniosMap[op.value]);
    });

    const siniestroMap: Record<string, string> = {
      si: "usoConductores.seguroAnterior.siniestro.options.si",
      no: "usoConductores.seguroAnterior.siniestro.options.no",
    };

    this.siniestroOpciones.forEach((op) => {
      op.label = t(siniestroMap[op.value]);
    });
  }

  private enfocarSiguienteDigito(index: number): void {
    if (index >= this.ultimosDigitosPoliza().length - 1) {
      return;
    }

    setTimeout(() => void this.digitoPolizaInputs.get(index + 1)?.setFocus());
  }
}
