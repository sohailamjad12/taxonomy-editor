import { TestBed } from '@angular/core/testing';

import { OdcsService } from './odcs.service';

describe('OdcsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: OdcsService = TestBed.get(OdcsService);
    expect(service).toBeTruthy();
  });
});
