import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BusquedaMatricula } from "./busqueda-matricula";

describe("BusquedaMatricula", () => {
  let component: BusquedaMatricula;
  let fixture: ComponentFixture<BusquedaMatricula>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusquedaMatricula],
    }).compileComponents();

    fixture = TestBed.createComponent(BusquedaMatricula);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
