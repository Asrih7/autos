import { Component, inject, OnDestroy, OnInit } from "@angular/core";
import { PageNavigationService } from "@mnv-autos-ng/navigation";
import { DatosBancarios } from "./steps/datos-bancarios/datos-bancarios";

@Component({
  selector: "app-contratacion",
  standalone: true,
  imports: [DatosBancarios],
  templateUrl: "./contratacion.html",
  styleUrls: ["./contratacion.scss"],
})
export class ContratacionComponent implements OnInit, OnDestroy {
  private readonly navService = inject(PageNavigationService);

  ngOnInit(): void {
    this.navService.activePageConfig.set({
      pageId: "contratacion",
      previousPageUrl: "/precio-coberturas",
      previousPageLabel: "Precio y coberturas",
      nextPageUrl: "",
    });
  }

  ngOnDestroy(): void {
    this.navService.activePageConfig.set(null);
  }
}
