import { ComponentRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  TarjetaClienteEncontrado,
  type TarjetaClienteEncontradoData,
} from './tarjeta-cliente-encontrado';

describe('TarjetaClienteEncontrado', () => {
  let componentRef: ComponentRef<TarjetaClienteEncontrado>;
  let fixture: ComponentFixture<TarjetaClienteEncontrado>;

  const person: TarjetaClienteEncontradoData = {
    name: 'Ana Torres Fernandez',
    clientType: 'Cliente platino',
    documentType: 'DNI',
    documentNumber: '11843928V',
    nationality: 'Espanola',
    age: 49,
    address: 'Calle Jaime Arjona 29, 4D, 28017 Madrid',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TarjetaClienteEncontrado],
    }).compileComponents();

    fixture = TestBed.createComponent(TarjetaClienteEncontrado);
    componentRef = fixture.componentRef;
    componentRef.setInput('person', person);
    await fixture.whenStable();
  });

  it('renders the person data', () => {
    expect(fixture.nativeElement.textContent).toContain(person.name);
    expect(fixture.nativeElement.textContent).toContain(person.documentNumber);
    expect(fixture.nativeElement.textContent).toContain(person.address);
  });

  it('emits the person when edit is clicked', () => {
    const emitted: TarjetaClienteEncontradoData[] = [];
    fixture.componentInstance.edit.subscribe((value) => emitted.push(value));

    fixture.nativeElement.querySelector('button').click();

    expect(emitted).toEqual([person]);
  });
});
