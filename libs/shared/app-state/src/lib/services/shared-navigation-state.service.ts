import { Injectable } from '@angular/core';
import { Pantalla } from '@mnv-autos-ng/models';

@Injectable({
  providedIn: 'root',
})
export class SharedNavigationStateService {
  private pantallas: Pantalla[] = [];
  private nombre: string = "";


  getPantallas(): Pantalla[] {
    return this.pantallas;
  }

  setPantallas(pantallas: Pantalla[]) {
    this.pantallas = pantallas;
  }

  getNombre(): string {
    return this.nombre;
  }

  setNombre(nombre: string) {
    this.nombre = nombre;
  }

}
