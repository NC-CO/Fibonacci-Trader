import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PolygonApiControllerComponent } from './polygon-api-controller.component';

describe('PolygonApiControllerComponent', () => {
  let component: PolygonApiControllerComponent;
  let fixture: ComponentFixture<PolygonApiControllerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PolygonApiControllerComponent]
    });
    fixture = TestBed.createComponent(PolygonApiControllerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
