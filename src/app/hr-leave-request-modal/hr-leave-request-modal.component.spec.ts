import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HrLeaveRequestModalComponent } from './hr-leave-request-modal.component';

describe('HrLeaveRequestModalComponent', () => {
  let component: HrLeaveRequestModalComponent;
  let fixture: ComponentFixture<HrLeaveRequestModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HrLeaveRequestModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HrLeaveRequestModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
