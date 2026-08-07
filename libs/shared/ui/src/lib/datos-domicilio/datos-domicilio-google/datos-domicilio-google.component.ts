import { AfterViewInit,  Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild, signal } from '@angular/core';
import { BalHeading, BalInput } from '@baloise/ds-angular';
import { TranslateModule } from '@ngx-translate/core';
import { DatosDomicilioModel } from '../models/address.model';

@Component({
  selector: 'app-datos-domicilio-google',
  standalone: true,
  imports: [BalInput, BalHeading, TranslateModule],
  templateUrl: './datos-domicilio-google.component.html',
})
export class DatosDomicilioGoogle implements OnChanges, AfterViewInit, OnDestroy {
  @ViewChild('autocompleteInput', { static: true, read: ElementRef })
  autocompleteInput!: ElementRef<HTMLElement>;

  @Input() value = '';
  @Input({ alias: 'placeholder' }) searchPlaceholder = 'tuCliente.address.googlePlaceholder';
  @Input() ariaLabel = 'tuCliente.address.ariaLabel';
  @Output() addressSelected = new EventEmitter<DatosDomicilioModel>();
  @Output() clearSelection = new EventEmitter<void>();

  readonly selectedText = signal('');

  private autocomplete: any;
  private autocompleteInputElement?: HTMLInputElement;
  private googleMapsLoader?: Promise<void>;
  private hasSelectedAddress = false;

  ngAfterViewInit(): void {
    this.setupAutocomplete();
  }

  ngOnDestroy(): void {
    this.autocompleteInputElement?.removeEventListener('focus', this.onSearchFocus);
    this.autocomplete?.unbindAll?.();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('value' in changes) {
      const incoming = String(this.value ?? '').trim();
      this.selectedText.set(incoming);

      if (!incoming) {
        this.clearSelection.emit();
      }

      queueMicrotask(() => this.setupAutocomplete());
    }
  }

  onInput(event: any): void {
    const inputValue = String(event?.detail ?? event?.target?.value ?? '').trim();
    this.selectedText.set(inputValue);

    if (!inputValue) {
      this.clearSelection.emit();
    }

    this.setupAutocomplete();
  }

  private setupAutocomplete(): void {
    const hostElement = this.autocompleteInput?.nativeElement;
    if (!hostElement) {
      return;
    }

    let inputElement = hostElement.querySelector?.('input') as HTMLInputElement | null;
    if (!inputElement && (hostElement as any).shadowRoot) {
      inputElement = (hostElement as any).shadowRoot.querySelector('input') as HTMLInputElement | null;
    }

    if (!inputElement && hostElement instanceof HTMLInputElement) {
      inputElement = hostElement;
    }

    if (!inputElement) {
      return;
    }

    this.loadGoogleMapsScript()
      .then(() => {
        this.initializeAutocomplete(inputElement);
      })
      .catch(() => {
        this.initializeAutocomplete(inputElement);
      });
  }

  private loadGoogleMapsScript(): Promise<void> {
    if (this.googleMapsLoader) {
      return this.googleMapsLoader;
    }

    const google = (window as any).google;
    if (google?.maps?.places?.Autocomplete) {
      this.googleMapsLoader = Promise.resolve();
      return this.googleMapsLoader;
    }

    this.googleMapsLoader = new Promise((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>('script[data-google-maps]');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Maps script')));
        return;
      }

      const callbackName = `googleMapsCallback_${Math.random().toString(36).slice(2)}`;
      (window as any)[callbackName] = () => {
        resolve();
        delete (window as any)[callbackName];
      };

      const script = document.createElement('script');
      script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyAByX_2h0IAdnLtayGagZzap26gGcdc3vw&libraries=places&language=es&callback=' + callbackName;
      script.async = true;
      script.defer = true;
      script.setAttribute('data-google-maps', 'true');
      script.addEventListener('error', () => reject(new Error('Failed to load Google Maps script')));
      document.head.appendChild(script);
    });

    return this.googleMapsLoader;
  }

  private initializeAutocomplete(inputElement: HTMLInputElement): void {
    if (this.autocomplete && this.autocompleteInputElement === inputElement) {
      return;
    }

    this.autocompleteInputElement?.removeEventListener('focus', this.onSearchFocus);
    this.autocomplete?.unbindAll?.();
    this.autocomplete = undefined;

    const google = (window as any).google;
    if (!google?.maps?.places?.Autocomplete) {
      return;
    }

    this.autocomplete = new google.maps.places.Autocomplete(inputElement, {
      types: ['address'],
      componentRestrictions: { country: 'ES' },
    });

    this.autocomplete.setFields(['address_component', 'formatted_address', 'name']);
    this.autocomplete.addListener('place_changed', () => this.onPlaceChanged());
    this.autocompleteInputElement = inputElement;
    inputElement.addEventListener('focus', this.onSearchFocus);
  }

  private onPlaceChanged(): void {
    if (!this.autocomplete) {
      return;
    }

    const place = this.autocomplete.getPlace();
    const parsed = this.parsePlace(place);
    if (!parsed) {
      return;
    }

    this.selectedText.set(this.formatAddress(parsed));
    this.hasSelectedAddress = true;
    this.addressSelected.emit(parsed);
  }

  private readonly onSearchFocus = (): void => {
    if (!this.hasSelectedAddress) return;

    this.hasSelectedAddress = false;
    this.selectedText.set('');
  };

  private parsePlace(place: any): DatosDomicilioModel | null {
    if (!place || !Array.isArray(place.address_components)) {
      return null;
    }

    const getComponent = (type: string): string => {
      const component = place.address_components.find(
        (item: any) => Array.isArray(item.types) && item.types.includes(type),
      );
      return component?.long_name ?? '';
    };

    const formattedAddress = String(place.formatted_address ?? place.name ?? '');
    const formattedParts = formattedAddress.split(',').map((part) => part.trim()).filter(Boolean);
    const route = getComponent('route') || formattedParts[0] || '';
    let streetNumber =
      getComponent('street_number') ||
      getComponent('subpremise') ||
      getComponent('premise') ||
      this.getStreetNumberFromText(formattedAddress);
    const postalCode = getComponent('postal_code') || this.getPostalCodeFromText(formattedAddress);
    const locality =
      getComponent('locality') ||
      getComponent('postal_town') ||
      getComponent('sublocality_level_1') ||
      getComponent('sublocality') ||
      getComponent('neighborhood') ||
      getComponent('administrative_area_level_4') ||
      getComponent('administrative_area_level_3') ||
      getComponent('administrative_area_level_2') ||
      this.getLocalityFromText(formattedAddress);
    const province =
      getComponent('administrative_area_level_2') ||
      getComponent('administrative_area_level_1') ||
      getComponent('administrative_area_level_3') ||
      this.getProvinceFromText(formattedParts);

    const normalizedRoute = route.trim();
    const routeTokens = normalizedRoute.split(' ').filter(Boolean);
    let tipoVia = '';
    let nombreVia = '';

    const firstToken = routeTokens.length > 0 ? routeTokens[0] : '';
    const normalizedTipoVia = this.normalizeTipoVia(firstToken);

    if (routeTokens.length > 1) {
      tipoVia = normalizedTipoVia || firstToken;
      nombreVia = routeTokens.slice(1).join(' ');
    } else if (routeTokens.length === 1) {
      nombreVia = normalizedRoute;
    } else if (normalizedRoute) {
      nombreVia = normalizedRoute;
    }

    if (!streetNumber && normalizedRoute) {
      const match = normalizedRoute.match(/^(.*)\s+(\d+[A-Za-z]?)$/);
      if (match) {
        streetNumber = match[2];
        const routeWithoutNumber = match[1].trim();
        const tokens = routeWithoutNumber.split(' ').filter(Boolean);
        const normalizedPrefix = tokens.length > 0 ? this.normalizeTipoVia(tokens[0]) : '';
        if (tokens.length > 1) {
          tipoVia = normalizedPrefix || tokens[0];
          nombreVia = tokens.slice(1).join(' ');
        } else {
          nombreVia = routeWithoutNumber;
        }
      }
    }

    return {
      tipoVia,
      nombreVia,
      numero: streetNumber,
      codigoPostal: postalCode,
      provincia: province,
      localidad: locality,
    };
  }

  private normalizeTipoVia(rawTipoVia: string): string {
    if (!rawTipoVia) {
      return '';
    }

    const lookup: Record<string, string> = {
      calle: 'Calle',
      c: 'Calle',
      'c/': 'Calle',
      av: 'Avenida',
      avda: 'Avenida',
      avd: 'Avenida',
      'av.': 'Avenida',
      avenida: 'Avenida',
      plaza: 'Plaza',
      pl: 'Plaza',
      alameda: 'Alameda',
      al: 'Alameda',
      autovia: 'Autovía',
      barrio: 'Barrio',
      camino: 'Camino',
      cm: 'Camino',
      cuesta: 'Cuesta',
      glorieta: 'Glorieta',
      pasaje: 'Pasaje',
      paseo: 'Paseo',
      poligono: 'Polígono',
      'polígono': 'Polígono',
      ronda: 'Ronda',
      carretera: 'Carretera',
      cr: 'Carretera',
      travesia: 'Travesía',
      'travesía': 'Travesía',
      urbanizacion: 'Urbanización',
      'urbanización': 'Urbanización',
      'p.º': 'Paseo',
      'carrer': 'Calle',
    };

    const normalized = rawTipoVia.toLowerCase().replace(/[\.]/g, '').trim();
    return lookup[normalized] ?? '';
  }

  private getStreetNumberFromText(value: string): string {
    const match = value.match(/(?:,|\s)(\d+[A-Za-z]?)\b/);
    return match?.[1] ?? '';
  }

  private getPostalCodeFromText(value: string): string {
    return value.match(/\b\d{5}\b/)?.[0] ?? '';
  }

  private getLocalityFromText(value: string): string {
    const match = value.match(/\b\d{5}\s+([^,]+)/);
    return match?.[1]?.trim() ?? '';
  }

  private getProvinceFromText(parts: string[]): string {
    if (parts.length < 2) return '';
    return parts[parts.length - 2] ?? '';
  }

  private formatAddress(address: DatosDomicilioModel): string {
    const street = [address.tipoVia, address.nombreVia, address.numero]
      .filter(Boolean)
      .join(' ')
      .trim();
    const suffix = [address.codigoPostal, address.localidad].filter(Boolean).join(' ');
    return [street, suffix].filter(Boolean).join(', ');
  }
}
