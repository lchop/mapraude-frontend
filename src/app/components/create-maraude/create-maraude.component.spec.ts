import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateMaraudeComponent } from './create-maraude.component';

describe('CreateMaraudeComponent', () => {
  let component: CreateMaraudeComponent;
  let fixture: ComponentFixture<CreateMaraudeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateMaraudeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateMaraudeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
