import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeAttendanceSummaryComponent } from './employee-attendance-summary.component';

describe('EmployeeAttendanceSummaryComponent', () => {
  let component: EmployeeAttendanceSummaryComponent;
  let fixture: ComponentFixture<EmployeeAttendanceSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeAttendanceSummaryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeAttendanceSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
