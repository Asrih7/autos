import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ConfirmacionVersion } from "./confirmacion-version";

describe("ConfirmacionVersion", () => {
  let component: ConfirmacionVersion;
  let fixture: ComponentFixture<ConfirmacionVersion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmacionVersion],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmacionVersion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
