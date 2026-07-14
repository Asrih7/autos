import { ComponentFixture, TestBed } from "@angular/core/testing";
import { PrecioCoberturasComponent } from "./precio-coberturas";

describe("PrecioCoberturas", () => {
  let component: PrecioCoberturasComponent;
  let fixture: ComponentFixture<PrecioCoberturasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrecioCoberturasComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PrecioCoberturasComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
