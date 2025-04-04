import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TravelRequestViewComponent } from './travel-request-view.component';

describe('TravelRequestViewComponent', () => {
  let component: TravelRequestViewComponent;
  let fixture: ComponentFixture<TravelRequestViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TravelRequestViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TravelRequestViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
