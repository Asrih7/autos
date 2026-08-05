import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DatosDomicilioForm } from './datos-domicilio-form.component';

describe("VehiculoComponent", () => {
  let component: DatosDomicilioForm;
  let fixture: ComponentFixture<DatosDomicilioForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatosDomicilioForm],
    })
      .overrideComponent(DatosDomicilioForm, {
        set: {
          template: "",
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(DatosDomicilioForm);


    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});