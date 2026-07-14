import { Component, inject, OnInit, OnDestroy } from "@angular/core";
import { PageNavigationService } from "@mnv-autos-ng/navigation";

@Component({
  selector: "app-tu-cliente",
  standalone: true,
  imports: [],
  templateUrl: "./tu-cliente.html",
  styleUrls: ["./tu-cliente.scss"],
})
export class TuClienteComponent implements OnInit, OnDestroy {
  private readonly navService = inject(PageNavigationService);

    ngOnInit(): void {
    this.navService.activePageConfig.set({
      pageId: 'tu-cliente',
      previousPageUrl: '',
      previousPageLabel: '',
      nextPageUrl: '/vehiculos'
    });
  }

    ngOnDestroy(): void {
    this.navService.activePageConfig.set(null);
  }
}
