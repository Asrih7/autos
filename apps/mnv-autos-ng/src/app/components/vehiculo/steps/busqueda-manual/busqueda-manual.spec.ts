import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BusquedaManualComponent } from "./busqueda-manual";

describe("BusquedaManual", () => {
  let component: BusquedaManualComponent;
  let fixture: ComponentFixture<BusquedaManualComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusquedaManualComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BusquedaManualComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
