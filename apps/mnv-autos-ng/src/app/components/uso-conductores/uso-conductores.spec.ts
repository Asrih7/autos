import { UsoConductoresComponent } from './uso-conductores';
import { ComponentFixture, TestBed } from "@angular/core/testing";

describe("UsoConductores", () => {
  let component: UsoConductoresComponent;
  let fixture: ComponentFixture<UsoConductoresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsoConductoresComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UsoConductoresComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
