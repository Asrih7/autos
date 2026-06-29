import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { BalNavbar, BalNavbarBrand, BalSheet } from '@baloise/ds-angular';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './app-header.component.html',
  styleUrls: ['./app-header.component.css'],
  imports: [
    CommonModule,
    BalNavbar,
    BalNavbarBrand,
    BalSheet,
  ]
})
export class AppHeaderComponent {
}
