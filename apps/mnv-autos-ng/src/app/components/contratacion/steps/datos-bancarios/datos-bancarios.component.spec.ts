import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DatosBancarios } from "./datos-bancarios.component";
import { TranslateModule } from "@ngx-translate/core";

describe("DatosBancarios", () => {
  let component: DatosBancarios;
  let fixture: ComponentFixture<DatosBancarios>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatosBancarios, TranslateModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(DatosBancarios);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
