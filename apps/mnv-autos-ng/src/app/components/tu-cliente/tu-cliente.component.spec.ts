import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideMockDatosPersonaOptionsApi } from "./steps/datos-persona/data-access/mock-datos-persona-options.api";
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
          providers: [provideMockDatosPersonaOptionsApi()],
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
