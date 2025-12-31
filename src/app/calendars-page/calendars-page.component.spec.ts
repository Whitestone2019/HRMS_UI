import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalendarsPageComponent } from './calendars-page.component';

describe('CalendarsPageComponent', () => {
  let component: CalendarsPageComponent;
  let fixture: ComponentFixture<CalendarsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalendarsPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CalendarsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
