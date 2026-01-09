import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetClearanceComponent } from './asset-clearance.component';

describe('AssetClearanceComponent', () => {
  let component: AssetClearanceComponent;
  let fixture: ComponentFixture<AssetClearanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssetClearanceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssetClearanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
