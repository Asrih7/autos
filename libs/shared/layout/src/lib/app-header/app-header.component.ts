import { Component, Output, EventEmitter } from '@angular/core';
import { BalNavbar, BalNavbarBrand, BalIcon } from '@baloise/ds-angular';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [BalNavbar, BalNavbarBrand, BalIcon],
  templateUrl: './app-header.component.html',
  styleUrls: ['./app-header.component.css'],
})
export class AppHeaderComponent {
  @Output() menuClick = new EventEmitter<void>();
}
