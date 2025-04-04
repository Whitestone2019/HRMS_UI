import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmpDirComponent } from './empdir.component';

describe('EmpdirComponent', () => {
  let component: EmpDirComponent;
  let fixture: ComponentFixture<EmpDirComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmpDirComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmpDirComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
