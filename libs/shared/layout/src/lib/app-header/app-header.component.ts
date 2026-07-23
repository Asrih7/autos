import { Component } from '@angular/core';
import { BalNavbar, BalNavbarBrand } from '@baloise/ds-angular';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [ BalNavbar, BalNavbarBrand],
  templateUrl: './app-header.component.html',
  styleUrls: ['./app-header.component.css'],
})
export class AppHeaderComponent {}