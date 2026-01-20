import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CelebrationPageComponent } from './celebration-page.component';

describe('CelebrationPageComponent', () => {
  let component: CelebrationPageComponent;
  let fixture: ComponentFixture<CelebrationPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CelebrationPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CelebrationPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
