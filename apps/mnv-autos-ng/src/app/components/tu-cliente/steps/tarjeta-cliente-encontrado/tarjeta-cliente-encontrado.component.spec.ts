import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { TarjetaClienteEncontrado, TarjetaClienteEncontradoData } from './tarjeta-cliente-encontrado.component';

describe('TarjetaClienteEncontrado', () => {
  let component: TarjetaClienteEncontrado;
  let fixture: ComponentFixture<TarjetaClienteEncontrado>;

  const mockPerson: TarjetaClienteEncontradoData = {
    name: 'Juan Pérez',
    clientType: 'particular',
    documentType: 'dni',
    documentNumber: '12345678A',
    nationality: 'ES',
    age: 35,
    address: 'Calle Falsa 123',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TarjetaClienteEncontrado, TranslateModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(TarjetaClienteEncontrado);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('person', mockPerson);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('emits the person when edit is clicked', () => {
    const emitted: TarjetaClienteEncontradoData[] = [];
    component.edit.subscribe((p) => emitted.push(p));

    component['requestEdit']();

    expect(emitted).toEqual([mockPerson]);
  });
});