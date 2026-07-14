import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ContratacionComponent } from "./contratacion";

describe("Contratacion", () => {
  let component: ContratacionComponent;
  let fixture: ComponentFixture<ContratacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContratacionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ContratacionComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
