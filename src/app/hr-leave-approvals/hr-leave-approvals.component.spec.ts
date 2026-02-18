import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HrLeaveApprovalsComponent } from './hr-leave-approvals.component';

describe('HrLeaveApprovalsComponent', () => {
  let component: HrLeaveApprovalsComponent;
  let fixture: ComponentFixture<HrLeaveApprovalsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HrLeaveApprovalsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HrLeaveApprovalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
