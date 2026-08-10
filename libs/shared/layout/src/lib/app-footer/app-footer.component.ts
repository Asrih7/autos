import { Component, inject } from '@angular/core';
import { BalButton } from '@baloise/ds-angular';
import { PageNavigationService } from '@mnv-autos-ng/navigation';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [BalButton],
  templateUrl: './app-footer.component.html',
  styleUrls: ['./app-footer.component.scss'],
})
export class AppFooterComponent {
  protected readonly navService = inject(PageNavigationService);
}
