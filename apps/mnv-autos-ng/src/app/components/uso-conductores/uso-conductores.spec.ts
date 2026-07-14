import { ComponentFixture, TestBed } from "@angular/core/testing";
import { UsoConductoresComponent } from "./uso-conductores";

describe("UsoConductores", () => {
  let component: UsoConductoresComponent;
  let fixture: ComponentFixture<UsoConductoresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsoConductoresComponent],
    })
      .overrideComponent(UsoConductoresComponent, {
        set: {
          template: "",
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(UsoConductoresComponent);
    component = fixture.componentInstance;

  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});