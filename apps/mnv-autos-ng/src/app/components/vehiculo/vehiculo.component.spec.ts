import { ComponentFixture, TestBed } from "@angular/core/testing";
import { VehiculoComponent } from "./vehiculo.component";

describe("VehiculoComponent", () => {
  let component: VehiculoComponent;
  let fixture: ComponentFixture<VehiculoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehiculoComponent],
    })
      .overrideComponent(VehiculoComponent, {
        set: {
          template: "",
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(VehiculoComponent);

    fixture.componentRef.setInput("step", 0);

    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
