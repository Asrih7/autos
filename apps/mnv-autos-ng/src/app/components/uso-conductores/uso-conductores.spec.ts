import { ComponentFixture, TestBed } from "@angular/core/testing";
import { UsoConductores } from "./uso-conductores";

describe("UsoConductores", () => {
  let component: UsoConductores;
  let fixture: ComponentFixture<UsoConductores>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsoConductores],
    }).compileComponents();

    fixture = TestBed.createComponent(UsoConductores);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
