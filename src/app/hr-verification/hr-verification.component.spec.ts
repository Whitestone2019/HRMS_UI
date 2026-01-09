import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HRVerificationComponent } from './hr-verification.component';

describe('HRVerificationComponent', () => {
  let component: HRVerificationComponent;
  let fixture: ComponentFixture<HRVerificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HRVerificationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HRVerificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
