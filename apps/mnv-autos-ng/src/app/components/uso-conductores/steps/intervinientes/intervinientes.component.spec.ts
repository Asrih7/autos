import { ComponentFixture, TestBed } from "@angular/core/testing";
import { IntervinientesComponent } from "./intervinientes.component";

describe("VehiculoComponent", () => {
  let component: IntervinientesComponent;
  let fixture: ComponentFixture<IntervinientesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IntervinientesComponent],
    })
      .overrideComponent(IntervinientesComponent, {
        set: {
          template: "",
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(IntervinientesComponent);


    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});