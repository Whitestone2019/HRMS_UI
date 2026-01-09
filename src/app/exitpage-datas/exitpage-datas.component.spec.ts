import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExitpageDatasComponent } from './exitpage-datas.component';

describe('ExitpageDatasComponent', () => {
  let component: ExitpageDatasComponent;
  let fixture: ComponentFixture<ExitpageDatasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExitpageDatasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExitpageDatasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
