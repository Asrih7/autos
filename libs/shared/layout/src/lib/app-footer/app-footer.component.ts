import { Component } from '@angular/core';
import { BalFooter, BalSheet } from '@baloise/ds-angular';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [BalFooter, BalSheet],
  templateUrl: './app-footer.component.html',
  styleUrls: ['./app-footer.component.scss'],
})
export class AppFooterComponent {}
