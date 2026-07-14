import { Component, computed, input, model } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { GridItemSelector } from "@mnv-autos-ng/models";
import { 
  BalField, 
  BalFieldControl, 
  BalInput, 
  BalCard, 
  BalCardContent 
} from '@baloise/ds-angular';

@Component({
  selector: "lib-data-grid-selector",
  standalone: true,
  imports: [
    FormsModule,
    BalField,
    BalFieldControl,
    BalInput,
    BalCard,
    BalCardContent
  ],
  templateUrl: "./data-grid-selector.html",
  styleUrl: "./data-grid-selector.scss",
})
export class DataGridSelector {
  readonly items = input.required<GridItemSelector[]>();
  readonly placeholderBusqueda = input<string>('Buscar...');
  readonly sinResultadosTexto = input<string>('No se encontraron resultados');
  
  readonly idSeleccionado = model<string | null>(null);
  readonly filtroBusqueda = model<string>('');

  readonly itemsFiltrados = computed(() => {
    const texto = this.filtroBusqueda().toLowerCase().trim();
    if (!texto) return this.items();
    
    return this.items().filter(item => 
      item.nombre.toLowerCase().includes(texto)
    );
  });

  seleccionarItem(id: string): void {
    this.idSeleccionado.update(actual => actual === id ? null : id);
  }
}
