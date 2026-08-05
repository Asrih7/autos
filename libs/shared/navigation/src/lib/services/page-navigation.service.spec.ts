import { TestBed } from '@angular/core/testing';

import { PageNavigationService } from './page-navigation.service';

describe('PageNavigationService', () => {
  let service: PageNavigationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PageNavigationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
