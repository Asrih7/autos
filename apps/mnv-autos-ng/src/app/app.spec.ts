import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { BalBreakpointsService } from '@baloise/ds-angular';
import { App } from './app.component';

class MockBalBreakpointsService {
  readonly mobile = signal<boolean>(false).asReadonly();
  readonly tablet = signal<boolean>(false).asReadonly();
}

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        App,
        TranslateModule.forRoot(),
      ],
      providers: [
        provideRouter([]),
        {
          provide: BalBreakpointsService,
          useClass: MockBalBreakpointsService
        }
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    expect(app).toBeTruthy();
  });
});
