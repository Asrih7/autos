import { ComponentFixture, TestBed } from "@angular/core/testing";
import { RestoCampos } from "./resto-campos";

describe("RestoCampos", () => {
  let component: RestoCampos;
  let fixture: ComponentFixture<RestoCampos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RestoCampos],
    }).compileComponents();

    fixture = TestBed.createComponent(RestoCampos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
