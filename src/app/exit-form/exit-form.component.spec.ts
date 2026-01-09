import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExitFormComponent } from './exit-form.component';

describe('ExitFormComponent', () => {
  let component: ExitFormComponent;
  let fixture: ComponentFixture<ExitFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExitFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExitFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
