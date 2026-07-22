import { Component, computed, signal } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import {
  BalCard,
  BalCardContent,
  BalField,
  BalFieldControl,
  BalFieldMessage,
  BalHeading,
  BalInput,
  BalSelect,
  BalSelectOption,
  parseCustomEvent,
} from "@baloise/ds-angular";

@Component({
  selector: "app-datos-bancarios",
  imports: [
    BalCard,
    BalCardContent,
    BalHeading,
    BalField,
    BalFieldControl,
    BalFieldMessage,
    BalInput,
    BalSelect,
    BalSelectOption,
    TranslateModule
  ],
  templateUrl: "./datos-bancarios.html",
  styleUrl: "./datos-bancarios.scss",
})
export class DatosBancarios {
  readonly baseLangKey = "contratacion.datosBancarios";

  readonly ibanKey = "iban";
  readonly cardKey = "tarjeta";
  readonly bizumKey = "bizum";
  readonly listaMediosDePago = signal<any[]>([
    { id: this.ibanKey, name: "IBAN Bancario" },
    { id: this.cardKey, name: "Tarjeta" },
    { id: this.bizumKey, name: "Bizum" }
  ]);

  //#region Valores ingresados
  readonly medioSeleccionado = signal<string | null>(null);
  readonly textoIban = signal<string>("");
  readonly numeroTarjeta = signal<string>("");
  readonly fechaCaducidad = signal<string>("");
  readonly cvc = signal<string>("")
  readonly telefono = signal<string>("");
  readonly nombre = signal<string>("");
  readonly primerApellido = signal<string>("");
  readonly segundoApellido = signal<string>("");
  //#endregion Valores ingresados

  //#region Validaciones computed
  readonly esIbanInvalido = computed(() => !this.validarIBAN(String(this.textoIban())));
  readonly esTarjetaInvalida = computed(() => {
    const value = this.numeroTarjeta();
    if (!value) return false;
    return !this.isValidCardNumber(value);
  });
  readonly esFechaInvalida = computed(() => {
    const value = this.fechaCaducidad();
    if (!value) return false;
    return !this.isExpiryValid(value);
  });
  readonly esCvcInvalido = computed(() => {
    const value = this.cvc();
    if (!value) return false;
    return !/^\d{3,4}$/.test(value);
  });
  readonly esTelefonoInvalido = computed(() => {
    const value = this.telefono();
    if (!value) return false;
    return !/^\d{9}$/.test(value);
  });
  //#endregionregion Validaciones computed

  /**
   * Actualiza el medio de pago seleccionado.
   * @param ev Evento emitido por el selector de medios de pago.
   */
  cambioMedio(ev: CustomEvent): void {
    this.medioSeleccionado.set(ev.detail);
  }

  //#region IBAN
  /**
   * Actualiza y aplica la máscara visual al IBAN introducido por el usuario.
   * @param ev Evento de entrada del componente.
   */
  onInputIban(ev: CustomEvent): void {
    // Eliminar espacios y convertir a mayúsculas
    const cleanedInput = String(ev.detail).replace(/\s+/g, "").toUpperCase();

    // Agrupar cada 4 caracteres
    const maskedInput = cleanedInput.match(/.{1,4}/g)?.join(" ") ?? "";

    this.textoIban.set(maskedInput);
  }

  /**
   * Valida un IBAN según el estándar ISO 13616
   * @param iban - IBAN a validar (en mayúsculas y con espacios)
   * @returns true si es válido, false si no
   */
  validarIBAN(iban: string): boolean {
    // Eliminar espacios
    const cleanedIban = iban.replace(/\s+/g, "");

    // Longitud mínima y máxima según estándar
    if (cleanedIban.length < 15 || cleanedIban.length > 34) return false;

    // Mover los 4 primeros caracteres al final
    const rearranged = cleanedIban.slice(4) + cleanedIban.slice(0, 4);

    // Convertir letras a números (A=10, B=11, ..., Z=35)
    const numericIban = rearranged.replace(/[A-Z]/g, (char) => (char.charCodeAt(0) - 55).toString());

    // Validar usando mod 97
    return this.mod97(numericIban) === 1;
  }

  /**
   * Calcula el módulo 97 de un número muy grande representado como string. 
   * @param input Número sobre el que calcular el módulo 97.
   * @returns Resto de la división entre 97.
   */
  mod97(input: string): number {
    let remainder = 0;
    for (let i = 0; i < input.length; i++) {
      remainder = (remainder * 10 + parseInt(input[i], 10)) % 97;
    }
    return remainder;
  }
  //#endregion IBAN

  //#region Tarjeta
  /**
   * Actualiza y aplica la máscara visual al número de tarjeta introducido.
   * @param ev Evento de entrada del componente.
   */
  onInputNumeroTarjeta(ev: CustomEvent): void {
    // Limpiar input
    const cleanedInput = String(ev.detail).replace(/\D/g, "");

    // Agrupar cada 4 caracteres
    const maskedInput = cleanedInput.match(/.{1,4}/g)?.join(" ") ?? "";

    this.numeroTarjeta.set(maskedInput);
  }

  /**
   * Valida un número de tarjeta utilizando el algoritmo de Luhn.
   * @param cardNumber Número de tarjeta con o sin espacios.
   * @returns true si el número es válido; false en caso contrario.
   */
  isValidCardNumber(cardNumber: string): boolean {
    const digits = cardNumber.replace(/\s/g, '');

    if (!/^\d+$/.test(digits)) {
      return false;
    }

    let sum = 0;
    let shouldDouble = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = Number(digits[i]);

      if (shouldDouble) {
        digit *= 2;

        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      shouldDouble = !shouldDouble;
    }

    return sum % 10 === 0;
  }

  /**
   * Actualiza y aplica la máscara de fecha de caducidad en formato MM/AA.
   * @param ev Evento de entrada del componente.
   */
  onInputFecha(ev: CustomEvent): void {
    // Limpiar input
    const cleanedInput = String(ev.detail).replace(/\D/g, "");

    if (cleanedInput.length <= 2) {
      this.fechaCaducidad.set(cleanedInput);
    } else {
      // Aplicar máscara MM/AA
      const maskedInput = `${cleanedInput.slice(0, 2)}/${cleanedInput.slice(2)}`;
      this.fechaCaducidad.set(maskedInput);
    }
  }

  /**
   * Comprueba que una fecha de caducidad tenga un formato válido (MM/AA)
   * y que no corresponda a una fecha anterior al mes actual.
   * @param value Fecha de caducidad en formato MM/AA.
   * @returns true si la fecha es válida y no está vencida; false en caso contrario.
   */
  isExpiryValid(value: string): boolean {
    const match = value.match(/^(\d{2})\/(\d{2})$/);

    if (!match) {
      return false;
    }

    const month = Number(match[1]);
    const year = Number(match[2]);

    if (month < 1 || month > 12) {
      return false;
    }

    const now = new Date();

    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear() % 100;

    return (
      year > currentYear ||
      (year === currentYear && month >= currentMonth)
    );
  }

  /**
   * Actualiza el valor del código de seguridad (CVC/CVV).
   * @param ev Evento de entrada del componente.
   */
  onInputCvc(ev: CustomEvent): void {
    // Limpiar input
    const cleanedInput = String(ev.detail).replace(/\D/g, "");

    this.cvc.set(cleanedInput);
  }
  //#endregion Tarjeta

  //#region Bizum
  /**
   * Actualiza el número de teléfono asociado a Bizum.
   * @param ev Evento de entrada del componente.
   */
  onInputTelefono(ev: Event): void {
    const value = String(parseCustomEvent(ev) ?? '');

    const digits = value.replace(/\D/g, '');

    this.telefono.set(digits);
  }
  //#endregion Bizum

  //#region Titular
  /**
   * Actualiza los datos del titular introducidos por el usuario.
   * @param ev Evento de entrada del componente.
   * @param key Identificador del dato ingresado.
   */
  onInputTitular(ev: CustomEvent, key: 'name' | 'first' | 'second'): void {
    const input = String(ev.detail);

    switch (key) {
      case 'name':
        this.nombre.set(input);
        break;
      case 'first':
        this.primerApellido.set(input);
        break;
      case 'second':
        this.segundoApellido.set(input);
        break;
    }
  }
  //#endregion Titular
}
