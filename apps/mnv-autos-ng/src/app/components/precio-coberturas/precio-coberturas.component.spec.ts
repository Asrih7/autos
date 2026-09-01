import { ComponentFixture, TestBed } from "@angular/core/testing";
import { PrecioCoberturasComponent } from "./precio-coberturas.component";
import { TranslateModule } from "@ngx-translate/core";
import { PrecioCoberturasService } from "./services/precio-coberturas.service";
import { MockInstance } from "vitest";
import { of } from "rxjs";

describe("PrecioCoberturas", () => {
  let component: PrecioCoberturasComponent;
  let fixture: ComponentFixture<PrecioCoberturasComponent>;
  let mockPrecioCoberturas: Record<string, MockInstance>;

  beforeEach(async () => {
    mockPrecioCoberturas = {
      obtenerPeriodoCobro: vi.fn().mockReturnValue(of([{
        "codigo": "ANUA",
        "descripcion": "Anual"
      }])),
      obtenerGarantiaOcupantes: vi.fn().mockReturnValue(of({
        "numeroPlazasAseguradas": [{
          "valor": "1",
          "indicadorDefecto": null
        }],
        "capitalesFallecimiento": [{
          "valor": "30000",
          "indicadorDefecto": null
        }],
        "capitalesInvalidez": [{
          "valor": "30000",
          "indicadorDefecto": null
        }]
      }))
    }
    await TestBed.configureTestingModule({
      imports: [PrecioCoberturasComponent, TranslateModule.forRoot()],
      providers: [
        { provide: PrecioCoberturasService, useValue: mockPrecioCoberturas }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PrecioCoberturasComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
