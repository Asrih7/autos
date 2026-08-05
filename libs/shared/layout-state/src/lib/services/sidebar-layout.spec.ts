import { TestBed } from '@angular/core/testing';

import { SidebarLayout } from './sidebar-layout';

describe('SidebarLayout', () => {
  let service: SidebarLayout;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SidebarLayout);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
