import { Component, input } from "@angular/core";
import { UpperCasePipe, CurrencyPipe, registerLocaleData } from "@angular/common";
import localeEs from '@angular/common/locales/es';
import { BalButton, BalButtonGroup, BalIcon, BalList, BalListItem, BalListItemAccordionBody, BalListItemAccordionHead, BalListItemContent, BalListItemIcon, BalListItemTitle } from "@baloise/ds-angular";
import { Modalidad } from "../../models/modalidades.models";

registerLocaleData(localeEs);

@Component({
    selector: "app-grupo-modalidades",
    standalone: true,
    imports: [UpperCasePipe, CurrencyPipe, BalList, BalListItem, BalButton, BalButtonGroup, BalIcon, BalListItemAccordionHead, BalListItemIcon, BalListItemContent, BalListItemTitle, BalListItemAccordionBody],
    templateUrl: "./grupo-modalidades.component.html",
    styleUrls: ["./grupo-modalidades.component.scss"],
})
export class GrupoModalidadesComponent {
    readonly titulo = input.required<string>();
    readonly modalidades = input.required<Modalidad[]>();

    contratar(modalidad: Modalidad): void {
        console.log('Contratar => ', modalidad.descripcion);
    }

    solicitar(modalidad: Modalidad): void {
        console.log('Solicitar => ', modalidad.descripcion);
    }
}
