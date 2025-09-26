import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeHistoryComponent } from './employee-history.component';

describe('EmployeeHistoryComponent', () => {
  let component: EmployeeHistoryComponent;
  let fixture: ComponentFixture<EmployeeHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeHistoryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
