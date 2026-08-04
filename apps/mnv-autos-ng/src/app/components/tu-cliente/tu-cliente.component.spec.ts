import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DATOS_PERSONA_OPTIONS_API } from '@mnv-autos-ng/ui';
import { of } from 'rxjs';
import { TuClienteComponent } from "./tu-cliente.component";

describe("TuCliente", () => {
  let component: TuClienteComponent;
  let fixture: ComponentFixture<TuClienteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TuClienteComponent],
    })
      .overrideComponent(TuClienteComponent, {
        set: {
          providers: [
            {
              provide: DATOS_PERSONA_OPTIONS_API,
              useValue: {
                getOptions: () => of({ documentTypes: [], nationalities: [] }),
              },
            },
          ],
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
