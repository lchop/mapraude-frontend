import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaraudeListComponent } from './maraude-list.component';

describe('MaraudeListComponent', () => {
  let component: MaraudeListComponent;
  let fixture: ComponentFixture<MaraudeListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaraudeListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MaraudeListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
