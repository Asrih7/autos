import { ComponentFixture, TestBed } from "@angular/core/testing";
import { PrecioCoberturas } from "./precio-coberturas";

describe("PrecioCoberturas", () => {
  let component: PrecioCoberturas;
  let fixture: ComponentFixture<PrecioCoberturas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrecioCoberturas],
    }).compileComponents();

    fixture = TestBed.createComponent(PrecioCoberturas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
