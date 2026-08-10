import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GrupoModalidadesComponent } from "./grupo-modalidades.component";
import { Modalidad } from "../../models/modalidades.models";
import { TranslateModule } from "@ngx-translate/core";

describe("GrupoModalidades", () => {
    let component: GrupoModalidadesComponent;
    let fixture: ComponentFixture<GrupoModalidadesComponent>;
    let mockModalidades: Modalidad[] = [{
        codigo: 'TERCERO_BASICO',
        descripcion: 'Tercero básico',
        orden: '1',
        agrupacion: {
            codigo: "TERCEROS",
            descripcion: "Terceros",
            codigoRelacion: "TERCEROS_BASICO"
        },
        primaTotal: 63.00,
        primerRecibo: 63.00,
        restoRecibos: 0,
        franquicia: null,
        coberturasIncluidas: [],
        coberturasOpcionales: [],
        derogacion: false
    },
    {
        codigo: 'TERCERO_BASICO_LUNA',
        descripcion: 'Tercero básico + luna',
        orden: '2',
        agrupacion: {
            codigo: "TERCEROS",
            descripcion: "Terceros",
            codigoRelacion: "TERCERO_BASICO_LUNA"
        },
        primaTotal: 70.00,
        primerRecibo: 70.00,
        restoRecibos: 0,
        franquicia: null,
        coberturasIncluidas: [],
        coberturasOpcionales: [],
        derogacion: false,
    }]

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GrupoModalidadesComponent, TranslateModule.forRoot()],
        }).compileComponents();

        fixture = TestBed.createComponent(GrupoModalidadesComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput("titulo", 'Grupo de Modalidades');
        fixture.componentRef.setInput('codigo', 'TEST-001');
        fixture.componentRef.setInput("modalidades", mockModalidades);
        await fixture.whenStable();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
