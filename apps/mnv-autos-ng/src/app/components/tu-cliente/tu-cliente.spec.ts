import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TuClienteComponent } from "./tu-cliente";

describe("TuCliente", () => {
  let component: TuClienteComponent;
  let fixture: ComponentFixture<TuClienteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TuClienteComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TuClienteComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
