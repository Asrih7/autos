import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { vehiculoProgressGuard } from './vehiculo-progress.guard';

describe('vehiculoProgressGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => vehiculoProgressGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
