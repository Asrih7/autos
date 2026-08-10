import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { SeguroAnteriorComponent } from './seguro-anterior.component';

describe('SeguroAnteriorComponent', () => {
  let component: SeguroAnteriorComponent;
  let fixture: ComponentFixture<SeguroAnteriorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SeguroAnteriorComponent,
        HttpClientTestingModule,
        TranslateModule.forRoot(),
      ],
    })
      .overrideComponent(SeguroAnteriorComponent, {
        set: {
          template: '',
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(SeguroAnteriorComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
