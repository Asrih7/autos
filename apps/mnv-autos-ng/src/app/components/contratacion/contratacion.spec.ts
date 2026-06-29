import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Contratacion } from "./contratacion";

describe("Contratacion", () => {
  let component: Contratacion;
  let fixture: ComponentFixture<Contratacion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Contratacion],
    }).compileComponents();

    fixture = TestBed.createComponent(Contratacion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
