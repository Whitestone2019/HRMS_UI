import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpdashboardComponent } from './expdashboard.component';

describe('ExpdashboardComponent', () => {
  let component: ExpdashboardComponent;
  let fixture: ComponentFixture<ExpdashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpdashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExpdashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
