import { TestBed } from '@angular/core/testing';

import { MenuSelectionService } from './menu-selection.service';

describe('MenuSelectionService', () => {
  let service: MenuSelectionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MenuSelectionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
