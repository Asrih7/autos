import { ComponentRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FechaNacimiento } from './fecha-nacimiento.component';

describe('FechaNacimiento', () => {
  let componentRef: ComponentRef<FechaNacimiento>;
  let fixture: ComponentFixture<FechaNacimiento>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FechaNacimiento, TranslateModule.forRoot()],
    }).compileComponents();

    const translateService = TestBed.inject(TranslateService);
    translateService.setTranslation('es', {
      tuCliente: {
        birthDate: {
          label: 'Fecha de nacimiento del Tomador',
          placeholder: 'DD/MM/AAAA*',
          invalid: 'Introduce una fecha válida',
        },
      },
    });
    translateService.use('es');

    fixture = TestBed.createComponent(FechaNacimiento);
    componentRef = fixture.componentRef;
    componentRef.setInput('label', 'tuCliente.birthDate.label');
    componentRef.setInput('invalidMessage', 'tuCliente.birthDate.invalid');
    componentRef.setInput('placeholder', 'tuCliente.birthDate.placeholder');
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('renders the provided label and the Baloise date input', () => {
    expect(fixture.nativeElement.querySelector('bal-field-label').textContent).toContain(
      'Fecha de nacimiento del Tomador',
    );
    const dateInput = fixture.nativeElement.querySelector('bal-date');

    expect(dateInput).toBeTruthy();
    expect(dateInput.placeholder).toBe('DD/MM/AAAA*');
    expect(dateInput.required).toBe(true);
    expect(dateInput.allowInvalidValue).toBe(true);
    expect(fixture.nativeElement.querySelector('bal-field-message')).toBeNull();
  });

  it('updates the value when Baloise emits a change', () => {
    const dateInput = fixture.nativeElement.querySelector('bal-date');

    dateInput.dispatchEvent(new CustomEvent('balChange', { detail: '1984-05-11' }));
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBe('1984-05-11');
    expect(dateInput.invalid).toBe(false);
    expect(fixture.nativeElement.querySelector('bal-field-message')).toBeNull();
  });

  it('shows an error and clears the model when Baloise reports an invalid date', () => {
    const dateInput = fixture.nativeElement.querySelector('bal-date');

    dateInput.dispatchEvent(new CustomEvent('balChange', { detail: 'INVALID_VALUE' }));
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBeUndefined();
    expect(fixture.nativeElement.querySelector('bal-field').invalid).toBe(true);
    expect(dateInput.invalid).toBe(true);
    expect(fixture.nativeElement.querySelector('bal-field-message').textContent).toContain(
      'Introduce una fecha válida',
    );
  });

  it('marks an empty required field as invalid after blur', () => {
    const dateInput = fixture.nativeElement.querySelector('bal-date');

    dateInput.dispatchEvent(new CustomEvent('balBlur'));
    fixture.detectChanges();

    expect(dateInput.invalid).toBe(true);
    expect(fixture.nativeElement.querySelector('bal-field-message')).toBeTruthy();
  });

  it('allows an empty value when the field is optional', () => {
    componentRef.setInput('required', false);
    fixture.detectChanges();
    const dateInput = fixture.nativeElement.querySelector('bal-date');

    dateInput.dispatchEvent(new CustomEvent('balBlur'));
    fixture.detectChanges();

    expect(dateInput.invalid).toBe(false);
    expect(fixture.nativeElement.querySelector('bal-field-message')).toBeNull();
  });
});
