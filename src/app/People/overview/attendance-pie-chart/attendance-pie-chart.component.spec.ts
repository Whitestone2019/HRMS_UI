import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendancePieChartComponent } from './attendance-pie-chart.component';

describe('AttendancePieChartComponent', () => {
  let component: AttendancePieChartComponent;
  let fixture: ComponentFixture<AttendancePieChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttendancePieChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AttendancePieChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
