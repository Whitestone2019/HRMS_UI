import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserTraineeComponent } from './user-trainee.component';

describe('UserTraineeComponent', () => {
  let component: UserTraineeComponent;
  let fixture: ComponentFixture<UserTraineeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserTraineeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserTraineeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
