import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TuCliente } from "./tu-cliente";

describe("TuCliente", () => {
  let component: TuCliente;
  let fixture: ComponentFixture<TuCliente>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TuCliente],
    }).compileComponents();

    fixture = TestBed.createComponent(TuCliente);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
