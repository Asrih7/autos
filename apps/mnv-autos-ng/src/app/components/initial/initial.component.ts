import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal, OnInit, OnDestroy
} from '@angular/core';

import {
  Router
} from '@angular/router';

import {
  finalize
} from 'rxjs';

import {
  BalDropdown,
  BalHeading,
  BalLabel,
  BalOption,
} from '@baloise/ds-angular';

import {
  AgentSearchComponent
} from './search/agent.search.component';

import {
  CompanyDataService
} from './data/company-data.service';


import {
  CompanyDto
} from './model/dto/company.dto';

import {
  ProductDto
} from './model/dto/product.dto';

import {
  CollectiveDto
} from './model/dto/collective.dto';
import { ProductDataService } from './data/product-data.service';
import { AgentDto } from './model/dto/agent.dto';
import { InitialSelectionDto } from './model/dto/initialSelectionDto';
import { PageNavigationService } from '@mnv-autos-ng/navigation';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-inicial',
  standalone: true,

  imports: [
    AgentSearchComponent,
    BalLabel,
    BalDropdown,
    BalOption,
    BalHeading,
    TranslateModule,

  ],

  templateUrl:
'./initial.component.html',

  styleUrl:
    './initial.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class InicialComponent implements OnInit, OnDestroy {
  private readonly navService = inject(PageNavigationService);
  private readonly companyDataService =
    inject(CompanyDataService);

  private readonly productDataService =
    inject(ProductDataService);

  private readonly router =
    inject(Router);

  private readonly SESSION_SELECTION_KEY = 'INITIAL_SELECTION_EMPLOYEE';


  ngOnInit(): void {
    this.navService.activePageConfig.set({
      pageId: 'initial',
      previousPageUrl: '',
      previousPageLabel: '',
      nextPageUrl: '/tu-cliente',
      useCustomClass: 'uso-actions-right',
      canContinueNext: ()=> true,
      showNextButton: ()=>true,
    });
    this.navService.currentStepCallback.set(()=>this.onAccept());

  }

  readonly selectedAgent =
    signal<AgentDto | null>(null);

  readonly companies =
    signal<CompanyDto[]>([]);

  readonly selectedCompany =
    signal<CompanyDto | null>(null);

  readonly companiesLoading =
    signal(false);


  readonly products =
    signal<ProductDto[]>([]);

  readonly selectedProduct =
    signal<ProductDto | null>(null);

  readonly productsLoading =
    signal(false);


  readonly collectives =
    signal<CollectiveDto[]>([]);

  readonly selectedCollective =
    signal<CollectiveDto | null>(null);

  readonly companyDisabled =
    computed(() =>
      !this.selectedAgent() ||
      this.companiesLoading()
    );


  readonly productDisabled =
    computed(() =>
      !this.selectedCompany() ||
      this.productsLoading()
    );


  readonly collectiveDisabled =
    computed(() =>
      !this.selectedProduct() ||
      this.collectives().length === 0
    );


  readonly canAccept =
    computed(() =>
      !!this.selectedAgent() &&
      !!this.selectedCompany() &&
      !!this.selectedProduct() &&
      !!this.selectedCollective()
    );


  protected onAgentSelected(
    agent: AgentDto
  ): void {

    this.selectedAgent.set(agent);

    /**
     * Si cambia el agente eliminamos
     * toda la selección dependiente.
     */
    this.resetCompany();

    this.loadCompanies(
      agent.id
    );
  }


  private loadCompanies(
    agentId: string
  ): void {

    this.companiesLoading.set(true);

    this.companyDataService
      .findByAgent(agentId)
      .pipe(

        finalize(() =>
          this.companiesLoading.set(false)
        )

      )
      .subscribe({

        next: companies => {

          this.companies.set(
            companies
          );
        },

        error: () => {
          this.companies.set([]);
        }
      });
  }

  protected onCompanyChange(
    companyCode: string
  ): void {

    const company =
      this.companies()
        .find(
          item =>
            item.code === companyCode
        );

    if (!company) {
      return;
    }

    this.selectedCompany.set(
      company
    );


    /**
     * Al cambiar compañía invalidamos
     * producto y colectiva.
     */
    this.resetProduct();


    /**
     * Aquí realizamos la llamada
     * REAL al backend.
     */
    this.loadProducts(
      company.code
    );
  }


  private loadProducts(
    companyCode: string
  ): void {

    this.productsLoading.set(true);


    this.productDataService
      .getProducts()
      .pipe(

        finalize(() =>
          this.productsLoading.set(false)
        )

      )
      .subscribe({

        next: products => {

          this.products.set(
            products
          );
        },
        error: () => {
          this.products.set([]);
          this.collectives.set([]);
        }
      });
  }

  protected onProductChange(
    productCode: string
  ): void {

    const product =
      this.products()
        .find(
          item =>
            item.code === productCode
        );


    if (!product) {
      return;
    }


    this.selectedProduct.set(
      product
    );


    /**
     * Si cambia el producto,
     * invalidamos la colectiva anterior.
     */
    this.selectedCollective.set(
      null
    );


    /**
     * Las colectivas NO requieren
     * otra llamada REST.
     *
     * Ya vienen anidadas dentro
     * del producto:
     *
     * producto.colectivas
     */
    this.collectives.set(
      product.collectives
    );
  }

  protected onCollectiveChange(
    collectiveCode: string
  ): void {

    const collective =
      this.collectives()
        .find(
          item =>
            item.code === collectiveCode
        );

    if (!collective) {
      return;
    }

    this.selectedCollective.set(
      collective
    );
  }


   protected onAccept(): void {

    if (!this.canAccept()) {
      return;
    }

    const selection: InitialSelectionDto = {
      agent: {
        id: this.selectedAgent()!.id,
        description: this.selectedAgent()!.description
      },
      company: {
        id: this.selectedCompany()!.code,
        description: this.selectedCompany()!.name
      },
      product: {
        id: this.selectedProduct()!.code,
        description: this.selectedProduct()!.description
      },
      collective: {
        id: this.selectedCollective()!.code,
        description: this.selectedCollective()!.description
      }
    };

    this.saveSelection(selection);

    
  }


  private saveSelection(
    selection: InitialSelectionDto
  ): void {

    sessionStorage.setItem(
      this.SESSION_SELECTION_KEY,
      JSON.stringify(selection)
    );
  }


  protected getCompanyLabel(
    company: CompanyDto
  ): string {

    return (
      `${company.code} - ` +
      `${company.name}`
    );
  }


  protected getProductLabel(
    product: ProductDto
  ): string {

    return (
      `${product.code} - ` +
      `${product.description}`
    );
  }


  protected getCollectiveLabel(
    collective: CollectiveDto
  ): string {

    return (
      `${collective.code} - ` +
      `${collective.description}`
    );
  }


  private resetCompany(): void {

    this.companies.set([]);
    this.selectedCompany.set(null);
    this.resetProduct();
  }


  private resetProduct(): void {

    this.products.set([]);
    this.selectedProduct.set(null);
    this.resetCollective();
  }


  private resetCollective(): void {

    this.collectives.set([]);
    this.selectedCollective.set(null);
  }
  ngOnDestroy(): void {
    this.navService.activePageConfig.set(null);
  }
}