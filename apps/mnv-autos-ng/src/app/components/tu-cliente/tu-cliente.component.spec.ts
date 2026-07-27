import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DATOS_PERSONA_OPTIONS_API } from '@mnv-autos-ng/ui';
import { of } from 'rxjs';
import { TuClienteComponent } from "./tu-cliente.component";

describe("TuCliente", () => {
  let component: TuClienteComponent;
  let fixture: ComponentFixture<TuClienteComponent>;

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
      imports: [TuClienteComponent],
    })
      .overrideComponent(TuClienteComponent, {
        set: {
          providers: [{ provide: DATOS_PERSONA_OPTIONS_API, useValue: { getOptions: () => of(mockOptions) } }],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(TuClienteComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
