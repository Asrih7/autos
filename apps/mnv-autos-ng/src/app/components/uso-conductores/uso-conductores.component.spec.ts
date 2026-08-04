import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { UsoConductoresComponent } from './uso-conductores.component';

describe('UsoConductores', () => {
  let component: UsoConductoresComponent;
  let fixture: ComponentFixture<UsoConductoresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        UsoConductoresComponent,
        HttpClientTestingModule,
        TranslateModule.forRoot(),
      ],
    })
      .overrideComponent(UsoConductoresComponent, {
        set: {
          template: '',
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(UsoConductoresComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
