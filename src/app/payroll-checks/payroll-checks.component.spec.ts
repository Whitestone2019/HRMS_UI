import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PayrollChecksComponent } from './payroll-checks.component';

describe('PayrollChecksComponent', () => {
  let component: PayrollChecksComponent;
  let fixture: ComponentFixture<PayrollChecksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PayrollChecksComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PayrollChecksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
