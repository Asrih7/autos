import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DatosBancarios } from "./datos-bancarios.component";
import { TranslateModule } from "@ngx-translate/core";
import { ContratacionService } from "../../services/contratacion.service";
import { of } from "rxjs";
import { MockInstance } from "vitest";

describe("DatosBancarios", () => {
  let component: DatosBancarios;
  let fixture: ComponentFixture<DatosBancarios>;
  let mockContratacion: Record<string, MockInstance>;

  beforeEach(async () => {
    mockContratacion = {
      obtenerFormaPago: vi.fn().mockReturnValue(of([
          {
            "codigo": "BANC",
            "descripcion": "Domiciliación Bancaria"
          },
          {
            "codigo": "CAJA",
            "descripcion": "Recibo físico"
          }
        ]
      ))
    }

    await TestBed.configureTestingModule({
      imports: [DatosBancarios, TranslateModule.forRoot()],
      providers: [
        { provide: ContratacionService, useValue: mockContratacion }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DatosBancarios);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
