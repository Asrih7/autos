import { Injectable, Signal, signal } from '@angular/core';
import { APP_PAGES } from '@mnv-autos-ng/models';

export interface SidebarItem { id: string; label: string; path: string; }

@Injectable({ providedIn: 'root' })
export class SidebarLayout {
  private readonly _items = signal<SidebarItem[]>([]);
  readonly items: Signal<SidebarItem[]> = this._items.asReadonly();

  constructor() { this.initializeMenuFromAppPages(); }

  private initializeMenuFromAppPages(): void {
    const pages = APP_PAGES
      .filter(p => p.showInMenu !== false)
      .map(p => ({ id: p.id, label: p.label, path: p.path ? `/${p.path}` : '/' }));
    const desiredOrder = ['tu-cliente','vehiculos','uso-conductores','precio-coberturas','contratacion'];
    const ordered = desiredOrder.map(id => pages.find(pg => pg.id === id)).filter(Boolean) as SidebarItem[];
    this._items.set(ordered);
  }
}
