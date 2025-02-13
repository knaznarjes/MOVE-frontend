import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListDevelopersComponent } from './list-developers.component';

describe('ListDevelopersComponent', () => {
  let component: ListDevelopersComponent;
  let fixture: ComponentFixture<ListDevelopersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListDevelopersComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListDevelopersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
