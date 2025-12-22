import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamAttendanceBreakdownPieComponent } from './team-attendance-breakdown-pie.component';

describe('TeamAttendanceBreakdownPieComponent', () => {
  let component: TeamAttendanceBreakdownPieComponent;
  let fixture: ComponentFixture<TeamAttendanceBreakdownPieComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamAttendanceBreakdownPieComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TeamAttendanceBreakdownPieComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
