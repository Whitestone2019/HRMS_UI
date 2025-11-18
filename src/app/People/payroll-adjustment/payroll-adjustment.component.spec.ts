import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PayrollAdjustmentComponent } from './payroll-adjustment.component';

describe('PayrollAdjustmentComponent', () => {
  let component: PayrollAdjustmentComponent;
  let fixture: ComponentFixture<PayrollAdjustmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PayrollAdjustmentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PayrollAdjustmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
