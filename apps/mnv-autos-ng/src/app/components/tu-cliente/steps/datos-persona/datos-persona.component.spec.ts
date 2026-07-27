import { TestBed } from '@angular/core/testing';
import { DatosPersona } from './datos-persona.component';
import { DATOS_PERSONA_OPTIONS_API } from '@mnv-autos-ng/ui';
import { of } from 'rxjs';

describe('DatosPersona', () => {
  beforeEach(async () => {
    const mockOptions = {
      documentTypes: [
        { value: 'dni', label: 'DNI' },
        { value: 'nif', label: 'NIF' },
        { value: 'cif', label: 'CIF' },
        { value: 'passport', label: 'Pasaporte' },
      ],
      nationalities: [
        { value: 'es', label: 'Española' },
        { value: 'de', label: 'Alemana' },
        { value: 'fr', label: 'Francesa' },
        { value: 'it', label: 'Italiana' },
        { value: 'pt', label: 'Portuguesa' },
        { value: 'gb', label: 'Británica' },
        { value: 'us', label: 'Estadounidense' },
        { value: 'mx', label: 'Mexicana' },
        { value: 'ar', label: 'Argentina' },
        { value: 'co', label: 'Colombiana' },
        { value: 'other', label: 'Otra' },
      ],
    };

    await TestBed.configureTestingModule({
      imports: [DatosPersona],
      providers: [{ provide: DATOS_PERSONA_OPTIONS_API, useValue: { getOptions: () => of(mockOptions) } }],
    }).compileComponents();
  });

  it('should render the options returned by the API', async () => {
    const fixture = TestBed.createComponent(DatosPersona);
    fixture.detectChanges();
    await fixture.whenStable();

    const options = Array.from(
      fixture.nativeElement.querySelectorAll('bal-select-option'),
    ) as HTMLElement[];

    expect(options.map((option) => option.textContent?.trim())).toEqual([
      'DNI',
      'NIF',
      'CIF',
      'Pasaporte',
      'Española',
      'Alemana',
      'Francesa',
      'Italiana',
      'Portuguesa',
      'Británica',
      'Estadounidense',
      'Mexicana',
      'Argentina',
      'Colombiana',
      'Otra',
    ]);
  });

  it('should validate the number using the selected document type', async () => {
    const fixture = TestBed.createComponent(DatosPersona);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const documentType = compiled.querySelector('bal-select[name="documentType"]');
    const documentNumber = compiled.querySelector('bal-input[name="documentNumber"]');

    expect(documentType).not.toBeNull();
    expect(documentNumber).not.toBeNull();

    documentType?.dispatchEvent(new CustomEvent('balChange', { detail: 'dni' }));
    documentNumber?.dispatchEvent(new CustomEvent('balInput', { detail: '12345678A' }));
    documentNumber?.dispatchEvent(new CustomEvent('balBlur'));
    fixture.detectChanges();

    expect(compiled.textContent).toContain('Introduce un DNI válido');

    documentNumber?.dispatchEvent(new CustomEvent('balInput', { detail: '12345678Z' }));
    fixture.detectChanges();

    expect(compiled.querySelector('bal-field-message')).toBeNull();

    documentType?.dispatchEvent(new CustomEvent('balChange', { detail: 'nif' }));
    fixture.detectChanges();

    expect(compiled.textContent).toContain('Introduce un NIF de persona jurídica válido');
  });

  it('should mark every visible personal data control as required', async () => {
    const fixture = TestBed.createComponent(DatosPersona);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const visibleControls = compiled.querySelectorAll<HTMLElement & { required: boolean }>(
      'bal-select[name], bal-input[name]',
    );

    expect(visibleControls).toHaveLength(6);
    expect(Array.from(visibleControls).every((control) => control.required)).toBe(true);
  });

  it('should enable the beneficiary switch by default', async () => {
    const fixture = TestBed.createComponent(DatosPersona);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const beneficiarySwitch = compiled.querySelector<HTMLElement & { checked: boolean }>(
      'bal-checkbox[name="sameBeneficiary"]',
    );

    expect(beneficiarySwitch?.checked).toBe(true);
  });

  it('should show business name and hide personal fields when CIF is selected', async () => {
    const fixture = TestBed.createComponent(DatosPersona);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const documentType = compiled.querySelector('bal-select[name="documentType"]');

    documentType?.dispatchEvent(new CustomEvent('balChange', { detail: 'cif' }));
    fixture.detectChanges();

    expect(compiled.querySelector('bal-input[name="businessName"]')).toBeTruthy();
    expect(compiled.textContent).toContain('Razón social');
    expect(compiled.querySelector('bal-select[name="nationality"]')).toBeNull();
    expect(compiled.querySelector('bal-input[name="firstName"]')).toBeNull();
    expect(compiled.querySelector('bal-input[name="firstSurname"]')).toBeNull();
    expect(compiled.querySelector('bal-input[name="secondSurname"]')).toBeNull();

    const visibleControls = compiled.querySelectorAll<HTMLElement & { required: boolean }>(
      'bal-select[name], bal-input[name]',
    );

    expect(visibleControls).toHaveLength(3);
    expect(Array.from(visibleControls).every((control) => control.required)).toBe(true);
  });
});
