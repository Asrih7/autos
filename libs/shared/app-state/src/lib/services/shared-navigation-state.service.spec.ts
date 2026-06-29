import { TestBed } from '@angular/core/testing';

import { SharedNavigationStateService } from './shared-navigation-state.service';

describe('SharedNavigationStateService', () => {
  let service: SharedNavigationStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SharedNavigationStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
