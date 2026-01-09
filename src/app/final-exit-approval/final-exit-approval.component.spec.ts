import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinalExitClosureComponent } from './final-exit-closure.component';

describe('FinalExitClosureComponent', () => {
  let component: FinalExitClosureComponent;
  let fixture: ComponentFixture<FinalExitClosureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinalExitClosureComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinalExitClosureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
