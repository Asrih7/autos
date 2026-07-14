import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DataGridSelector } from "./data-grid-selector";

describe("DataGridSelector", () => {
  let component: DataGridSelector;
  let fixture: ComponentFixture<DataGridSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataGridSelector],
    }).compileComponents();

    fixture = TestBed.createComponent(DataGridSelector);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
