import { Component, inject, OnDestroy, OnInit } from "@angular/core";
import { PageNavigationService } from "@mnv-autos-ng/navigation";

@Component({
  selector: "app-precio-coberturas",
  standalone: true,
  imports: [],
  templateUrl: "./precio-coberturas.html",
  styleUrls: ["./precio-coberturas.scss"],
})
export class PrecioCoberturasComponent implements OnInit, OnDestroy {
  private readonly navService = inject(PageNavigationService);

  ngOnInit(): void {
    this.navService.activePageConfig.set({
      pageId: "precio-coberturas",
      previousPageUrl: "/uso-conductores",
      previousPageLabel: "Conductores",
      nextPageUrl: "/contratacion",
    });
  }

  ngOnDestroy(): void {
    this.navService.activePageConfig.set(null);
  }
}
