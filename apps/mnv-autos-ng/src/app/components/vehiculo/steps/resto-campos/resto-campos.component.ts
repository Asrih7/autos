import { Component, computed, effect, inject, input, OnInit, signal, untracked } from "@angular/core";
import { BalButton, BalDate, BalField, BalFieldControl, BalInput, BalSelect, BalSelectOption, parseCustomEvent } from "@baloise/ds-angular";
import { VehiculoStateService } from "../../services/vehiculo-state.service";
import { RestoCamposModel } from "../../models/vehiculo.models";
import { TranslateModule } from "@ngx-translate/core";
import { getProvinciaByPostalCode, useIsMobile } from '@mnv-autos-ng/util'; 

@Component({
  selector: "app-resto-campos",
  standalone: true,
  imports: [BalButton, BalField, BalFieldControl, BalSelect, BalSelectOption, BalDate, BalInput, TranslateModule],
  templateUrl: "./resto-campos.component.html",
  styleUrl: "./resto-campos.component.scss",
})
export class RestoCampos implements OnInit {
  readonly onStepComplete = input<(stepOutputData: unknown) => void>();
  readonly stepId = input<string>();
  protected readonly stateService = inject(VehiculoStateService);

  readonly esMobile = useIsMobile();

  readonly opcionesCarroceria = this.stateService.carrocerias;
  readonly cargandoCarrocerias = this.stateService.loadingCarrocerias;
  
  readonly tieneRemolque = signal<boolean>(false);
  readonly tipoCarroceria = signal<string>("");
  readonly fechaMatriculacionIso = signal<string>(""); 
  readonly codigoPostal = signal<string>("");
  readonly provincia = signal<string>("");
  
  readonly isCpInvalidoEnEspana = signal<boolean>(false);

  readonly maxDateLimit = computed<string>(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });

  readonly cpInvalidoFormato = computed<boolean>(() => {
    const cpValue = this.codigoPostal().trim();
    return cpValue.length > 0 && cpValue.length !== 5;
  });

  readonly cpInvalido = computed<boolean>(() => {
    return this.cpInvalidoFormato() || this.isCpInvalidoEnEspana();
  });

  readonly botonDeshabilitado = computed<boolean>(() => {
    const necesitaCarroceria = this.opcionesCarroceria().length > 0;
    const carroceriaValida = necesitaCarroceria ? !!this.tipoCarroceria().trim() : true;

    return (
      !this.fechaMatriculacionIso().trim() || 
      !this.codigoPostal().trim() || 
      this.cpInvalido() ||
      !this.provincia().trim() ||
      !carroceriaValida ||
      this.cargandoCarrocerias() 
    );
  });
  
  readonly cachedRestoCampos = computed(() => this.stateService.state().vehiculoData?.restoCampos);

  readonly isFechaPreinformada = computed<boolean>(() => {
    return !!this.cachedRestoCampos()?.fechaPrimeraMatriculacion;
  });

  readonly isCpPreinformado = computed<boolean>(() => {
    return !!this.cachedRestoCampos()?.codigoPostalRegistro;
  });


  constructor() {
    effect(() => {
      const list = this.opcionesCarroceria();
      
      if (list.length > 0) {
        untracked(() => {
          if (!this.tipoCarroceria()) {
            this.tipoCarroceria.set(list[0].codigo);
          }
        });
      } else {
        untracked(() => {
          this.tipoCarroceria.set("");
        });
      }
    });

    effect(() => {
      const cp = this.codigoPostal().trim();
      
      if (cp.length === 5 && !this.cpInvalidoFormato()) {
        untracked(() => {
          const resolved = getProvinciaByPostalCode(cp);
          if (resolved) {
            this.provincia.set(resolved);
            this.isCpInvalidoEnEspana.set(false);
          } else {
            this.provincia.set("");
            this.isCpInvalidoEnEspana.set(true);
          }
        });
      } else {
        untracked(() => {
          if (cp.length < 5) {
            this.provincia.set(""); 
            this.isCpInvalidoEnEspana.set(false);
          }
        });
      }
    });
  }

  ngOnInit(): void {
    // this.stateService.loadCarroceriasCatalog();
    
    const cachedVehicle = this.stateService.state().vehiculoData;
    if (cachedVehicle?.restoCampos) {
      const data: RestoCamposModel = cachedVehicle.restoCampos;
      this.tieneRemolque.set(data.tieneRemolque ?? false);
      this.tipoCarroceria.set(data.tipoCarroceria ?? "");
      this.codigoPostal.set(data.codigoPostalRegistro ? String(data.codigoPostalRegistro) : "");
      this.provincia.set(data.provinciaRegistro ?? "");
      
      if (data.fechaPrimeraMatriculacion) {
        this.fechaMatriculacionIso.set(this.convertToIso(data.fechaPrimeraMatriculacion));
      }
    }
  }

  onSelectChange(event: Event): void {
    const parsed = parseCustomEvent(event);
    if (typeof parsed === "string") {
      this.tipoCarroceria.set(parsed);
    }
  }

  onDateChange(event: Event): void {
    const parsed = parseCustomEvent(event);
    if (typeof parsed === "string") {
      this.fechaMatriculacionIso.set(parsed);
    }
  }

  onInputChange(event: Event): void {
    const parsed = parseCustomEvent(event);
    const value = typeof parsed === "string" ? parsed : "";
    this.codigoPostal.set(value.replace(/\D/g, "")); 
  }

  confirmarDetalles(): void {
    if (!this.botonDeshabilitado()) {
      const camposPayload: RestoCamposModel = {
        tieneRemolque: this.tieneRemolque(),
        tipoCarroceria: this.tipoCarroceria() || "SIN_CARROZADO_ESPECIAL",
        fechaPrimeraMatriculacion: this.convertToDdmmyyyy(this.fechaMatriculacionIso()),
        codigoPostalRegistro: this.codigoPostal().trim(),
        provinciaRegistro: this.provincia()
      };

      this.stateService.saveRestoCampos(camposPayload);

      const callback = this.onStepComplete();
      if (callback) {
        callback({ status: "VEHICULO_DETALLES_CONFIRMED" });
      }
    }
  }

  private convertToIso(dateStr: string): string {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return "";
  }

  private convertToDdmmyyyy(isoStr: string): string {
    const parts = isoStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoStr;
  }
}
