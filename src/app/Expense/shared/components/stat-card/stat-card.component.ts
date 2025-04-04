import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stat-card">
      <h3>{{ title }}</h3>
      <p class="amount">{{ prefix }}{{ amount | number:'1.2-2' }}</p>
      <p class="trend" [class]="trendClass">{{ trend }}</p>
    </div>
  `,
  styles: [`
    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .stat-card h3 {
      margin: 0;
      color: #636e72;
      font-size: 14px;
    }
    .amount {
      font-size: 24px;
      font-weight: bold;
      margin: 10px 0;
    }
    .trend {
      font-size: 12px;
      margin: 0;
    }
    .trend.positive { color: #00b894; }
    .trend.negative { color: #d63031; }
    .trend.neutral { color: #636e72; }
  `]
})
export class StatCardComponent {
  @Input() title!: string;
  @Input() amount!: number;
  @Input() trend!: string;
  @Input() prefix: string = '₹';
  @Input() trendClass: 'positive' | 'negative' | 'neutral' = 'neutral';
}