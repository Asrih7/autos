import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FechaEfectoSeguroComponent } from './fecha-efecto-seguro.component';
import { UsoConductoresStateService } from '../../uso-conductores-state.service';

describe('FechaEfectoSeguroComponent', () => {
  let component: FechaEfectoSeguroComponent;
  let fixture: ComponentFixture<FechaEfectoSeguroComponent>;
  let state: UsoConductoresStateService;

  beforeEach(async () => {
    sessionStorage.clear();

    await TestBed.configureTestingModule({
      imports: [FechaEfectoSeguroComponent],
    })
      .overrideComponent(FechaEfectoSeguroComponent, {
        set: { template: '' },
      })
      .compileComponents();

    fixture = TestBed.createComponent(FechaEfectoSeguroComponent);
    component = fixture.componentInstance;
    state = TestBed.inject(UsoConductoresStateService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default the effective date to today when no date is stored', () => {
    fixture.detectChanges();

    const today = new Date().toISOString().split('T')[0];
    const fecha = state.fechaEfectoSeguro();

    expect(fecha.fechaISO).toBe(today);
    expect(fecha.completed).toBe(true);
    expect(fecha.dia).toBe(today.split('-')[2]);
    expect(fecha.mes).toBe(today.split('-')[1]);
    expect(fecha.anio).toBe(today.split('-')[0]);
  });


});
