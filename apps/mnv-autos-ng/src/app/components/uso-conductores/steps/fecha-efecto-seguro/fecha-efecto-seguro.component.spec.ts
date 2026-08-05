import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FechaEfectoSeguroComponent } from "./fecha-efecto-seguro.component";

describe("VehiculoComponent", () => {
  let component: FechaEfectoSeguroComponent;
  let fixture: ComponentFixture<FechaEfectoSeguroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FechaEfectoSeguroComponent],
    })
      .overrideComponent(FechaEfectoSeguroComponent, {
        set: {
          template: "",
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(FechaEfectoSeguroComponent);


    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});