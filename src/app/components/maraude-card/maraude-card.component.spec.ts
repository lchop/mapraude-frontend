import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaraudeCardComponent } from './maraude-card.component';

describe('MaraudeCardComponent', () => {
  let component: MaraudeCardComponent;
  let fixture: ComponentFixture<MaraudeCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaraudeCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MaraudeCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
