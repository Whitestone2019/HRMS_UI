import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendanceApprovalComponent } from './attendance-approval.component';

describe('AttendanceApprovalComponent', () => {
  let component: AttendanceApprovalComponent;
  let fixture: ComponentFixture<AttendanceApprovalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttendanceApprovalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AttendanceApprovalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
