import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddCandidateComponent } from './addcandidate.component';

describe('AddcandidateComponent', () => {
  let component: AddCandidateComponent;
  let fixture: ComponentFixture<AddCandidateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddCandidateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddCandidateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
