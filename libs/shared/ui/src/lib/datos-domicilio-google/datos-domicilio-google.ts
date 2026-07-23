import { AfterViewInit,  Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild, signal, inject } from '@angular/core';
import { BalHeading, BalInput } from '@baloise/ds-angular';
import { TranslateModule } from '@ngx-translate/core';
import { DatosDomicilioModel } from '../address.model';
import { DatosDomicilioService } from '../datos-domicilio.service';

@Component({
  selector: 'app-datos-domicilio-google',
  standalone: true,
  imports: [BalInput, BalHeading, TranslateModule],
  templateUrl: './datos-domicilio-google.html',
})
export class DatosDomicilioGoogle implements OnChanges, AfterViewInit, OnDestroy {
  @ViewChild('autocompleteInput', { static: true, read: ElementRef })
  autocompleteInput!: ElementRef<HTMLElement>;

  @Input() value = '';
  @Output() addressSelected = new EventEmitter<DatosDomicilioModel>();
  @Output() clearSelection = new EventEmitter<void>();

  private readonly datosService = inject(DatosDomicilioService);

  readonly placeholder = 'Busca una dirección con Google';
  readonly selectedText = signal('');

  private autocomplete: any;
  private googleMapsLoader?: Promise<void>;
  private legacyDomicilioLoader?: Promise<void>;

  ngAfterViewInit(): void {
    this.setupAutocomplete();
  }

  ngOnDestroy(): void {
    // No cleanup required when using a single injected script element.
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('value' in changes) {
      const incoming = String(this.value ?? '').trim();
      this.selectedText.set(incoming);

      if (!incoming) {
        this.clearSelection.emit();
      }
    }
  }

  onInput(event: any): void {
    const inputValue = String(event?.detail ?? event?.target?.value ?? '').trim();
    this.selectedText.set(inputValue);

    if (!inputValue) {
      this.clearSelection.emit();
    }
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

    Promise.all([this.loadGoogleMapsScript(), this.loadLegacyDomicilioScript()])
      .then(() => {
        const loader = (window as any).loadDomicilioGoogle;
        if (typeof loader === 'function') {
          loader(inputElement, (parsed: DatosDomicilioModel) => {
            this.selectedText.set(this.formatAddress(parsed));
            this.addressSelected.emit(parsed);
          });
          return;
        }

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
      script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyA-8_BXxZj6RxePx5kJpDhcGUSsijwto6o&libraries=places&language=es&callback=' + callbackName;
      script.async = true;
      script.defer = true;
      script.setAttribute('data-google-maps', 'true');
      script.addEventListener('error', () => reject(new Error('Failed to load Google Maps script')));
      document.head.appendChild(script);
    });

    return this.googleMapsLoader;
  }

  private loadLegacyDomicilioScript(): Promise<void> {
    if (this.legacyDomicilioLoader) {
      return this.legacyDomicilioLoader;
    }

    const legacyScript = document.querySelector<HTMLScriptElement>('script[data-legacy-domicilio]');
    if (legacyScript) {
      this.legacyDomicilioLoader = new Promise((resolve, reject) => {
        if ((window as any).loadDomicilioGoogle) {
          resolve();
          return;
        }
        legacyScript.addEventListener('load', () => {
          if ((window as any).loadDomicilioGoogle) {
            resolve();
            return;
          }
          reject(new Error('Legacy domicilio loader did not export loadDomicilioGoogle'));
        });
        legacyScript.addEventListener('error', () => reject(new Error('Failed to load legacy domicilio script')));
      });
      return this.legacyDomicilioLoader;
    }

    this.legacyDomicilioLoader = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'assets/ftl/E_PRD_3014_TARIFICACION_PM.js';
      script.async = true;
      script.defer = true;
      script.setAttribute('data-legacy-domicilio', 'true');
      script.addEventListener('load', () => {
        if ((window as any).loadDomicilioGoogle) {
          resolve();
          return;
        }
        reject(new Error('Legacy domicilio loader did not export loadDomicilioGoogle'));
      });
      script.addEventListener('error', () => reject(new Error('Failed to load legacy domicilio script')));
      document.head.appendChild(script);
    });

    return this.legacyDomicilioLoader;
  }

  private initializeAutocomplete(inputElement: HTMLInputElement): void {
    if (this.autocomplete) {
      return;
    }

    const google = (window as any).google;
    if (!google?.maps?.places?.Autocomplete) {
      return;
    }

    this.autocomplete = new google.maps.places.Autocomplete(inputElement, {
      types: ['address'],
      componentRestrictions: { country: 'ES' },
    });

    this.autocomplete.setFields(['address_component']);
    this.autocomplete.addListener('place_changed', () => this.onPlaceChanged());
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
    this.addressSelected.emit(parsed);
  }

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

    const route = getComponent('route') || '';
    let streetNumber =
      getComponent('street_number') ||
      getComponent('subpremise') ||
      getComponent('premise');
    const postalCode = getComponent('postal_code') || '';
    const locality =
      getComponent('locality') ||
      getComponent('postal_town') ||
      getComponent('sublocality_level_1') ||
      getComponent('neighborhood') ||
      getComponent('administrative_area_level_3') ||
      getComponent('administrative_area_level_2') ||
      '';
    const province =
      getComponent('administrative_area_level_2') ||
      getComponent('administrative_area_level_1') ||
      getComponent('administrative_area_level_3') ||
      this.datosService.getProvinciaForCodigoPostal(postalCode) ||
      '';

    const normalizedRoute = route.trim();
    const routeTokens = normalizedRoute.split(' ').filter(Boolean);
    let tipoVia = '';
    let nombreVia = '';

    const firstToken = routeTokens.length > 0 ? routeTokens[0] : '';
    const normalizedTipoVia = this.normalizeTipoVia(firstToken);

    if (routeTokens.length > 1 && normalizedTipoVia) {
      tipoVia = normalizedTipoVia;
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
        if (normalizedPrefix && tokens.length > 1) {
          tipoVia = normalizedPrefix;
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
      camino: 'Camino',
      paseo: 'Paseo',
      ronda: 'Ronda',
      carretera: 'Carretera',
      'p.º': 'Paseo',
      'carrer': 'Calle',
    };

    const normalized = rawTipoVia.toLowerCase().replace(/[\.]/g, '').trim();
    return lookup[normalized] ?? '';
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