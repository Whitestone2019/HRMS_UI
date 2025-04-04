import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckInDialogComponent } from './check-in-dialog.component';

describe('CheckInDialogComponent', () => {
  let component: CheckInDialogComponent;
  let fixture: ComponentFixture<CheckInDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckInDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CheckInDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
