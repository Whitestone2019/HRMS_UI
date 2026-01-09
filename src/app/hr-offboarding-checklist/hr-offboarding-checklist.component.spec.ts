import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HrOffboardingChecklistComponent } from './hr-offboarding-checklist.component';

describe('HrOffboardingChecklistComponent', () => {
  let component: HrOffboardingChecklistComponent;
  let fixture: ComponentFixture<HrOffboardingChecklistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HrOffboardingChecklistComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HrOffboardingChecklistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
