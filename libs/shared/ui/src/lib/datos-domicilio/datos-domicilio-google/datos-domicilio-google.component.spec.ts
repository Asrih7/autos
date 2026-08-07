import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DatosDomicilioGoogle } from './datos-domicilio-google.component';

describe("VehiculoComponent", () => {
  let component: DatosDomicilioGoogle;
  let fixture: ComponentFixture<DatosDomicilioGoogle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatosDomicilioGoogle],
    })
      .overrideComponent(DatosDomicilioGoogle, {
        set: {
          template: "",
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(DatosDomicilioGoogle);


    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});