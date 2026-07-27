import { ComponentFixture, TestBed } from "@angular/core/testing";
import { UsoVehiculoComponent } from "./uso-vehiculo.component";

describe("VehiculoComponent", () => {
  let component: UsoVehiculoComponent;
  let fixture: ComponentFixture<UsoVehiculoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsoVehiculoComponent],
    })
      .overrideComponent(UsoVehiculoComponent, {
        set: {
          template: "",
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(UsoVehiculoComponent);


    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});