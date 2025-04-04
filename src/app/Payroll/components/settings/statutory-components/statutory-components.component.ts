import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../api.service';

interface PFSettings {
  rate: number;
  maxLimit: number;
  enabled: boolean;
}

interface ESISettings {
  rate: number;
  maxLimit: number;
  enabled: boolean;
}

interface PTSlab {
  id?: number;
  incomeMin: number;
  incomeMax: number;
  taxAmount: number;
  rCreUserId: string;
}

@Component({
  selector: 'app-statutory-components',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="statutory-components">
      <div class="page-header">
        <h2>Statutory Components</h2>
       <button class="btn btn-primary" (click)="activeTab === 0 || activeTab === 1 ? savePFAndESISettings() : savePTSlabs()">
  Save Changes
</button>
      </div>

      <div class="tabs">
        <ul class="tab-list">
          <li
            *ngFor="let tab of tabs; let i = index"
            [class.active]="i === activeTab"
            (click)="selectTab(i)"
          >
            {{ tab.title }}
          </li>
        </ul>

        <div class="tab-content">
          <ng-container *ngIf="activeTab === 0">
            <!-- PF Settings -->
            <div class="card">
              <h3>Provident Fund</h3>
              <form>
                <div class="form-group">
                  <label>PF Contribution Rate (%)</label>
                  <input
                    type="number"
                    class="form-control"
                    [(ngModel)]="pfSettings.rate"
                    name="pfRate"
                  />
                </div>
                <div class="form-group">
                  <label>Maximum Contribution Limit</label>
                  <input
                    type="number"
                    class="form-control"
                    [(ngModel)]="pfSettings.maxLimit"
                    name="pfMaxLimit"
                  />
                </div>
                <div class="form-check">
                  <input
                    type="checkbox"
                    class="form-check-input"
                    [(ngModel)]="pfSettings.enabled"
                    name="pfEnabled"
                  />
                  <label class="form-check-label">Enable PF Deduction</label>
                </div>
              </form>
            </div>
          </ng-container>

          <ng-container *ngIf="activeTab === 1">
            <!-- ESI Settings -->
            <div class="card">
              <h3>ESI</h3>
              <form>
                <div class="form-group">
                  <label>ESI Contribution Rate (%)</label>
                  <input
                    type="number"
                    class="form-control"
                    [(ngModel)]="esiSettings.rate"
                    name="esiRate"
                  />
                </div>
                <div class="form-group">
                  <label>Maximum Contribution Limit</label>
                  <input
                    type="number"
                    class="form-control"
                    [(ngModel)]="esiSettings.maxLimit"
                    name="esiMaxLimit"
                  />
                </div>
                <div class="form-check">
                  <input
                    type="checkbox"
                    class="form-check-input"
                    [(ngModel)]="esiSettings.enabled"
                    name="esiEnabled"
                  />
                  <label class="form-check-label">Enable ESI Deduction</label>
                </div>
              </form>
            </div>
          </ng-container>

          <ng-container *ngIf="activeTab === 2">
            <!-- Professional Tax -->
            <div class="card">
              <h3>Professional Tax</h3>
              <form>
                <div class="form-group">
                  <label>PT Slab Structure</label>
                  <table class="table">
                    <thead>
                      <tr>
                        <th>Income Range</th>
                        <th>Tax Amount</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let slab of ptSettings.slabs; let i = index">
                        <td>
                          <div class="slab-range">
                            <input
                              type="number"
                              class="form-control"
                              [(ngModel)]="slab.incomeMin"
                              [name]="'ptMin' + i"
                            />
                            <span>to</span>
                            <input
                              type="number"
                              class="form-control"
                              [(ngModel)]="slab.incomeMax"
                              [name]="'ptMax' + i"
                            />
                          </div>
                        </td>
                        <td>
                          <input
                            type="number"
                            class="form-control"
                            [(ngModel)]="slab.taxAmount"
                            [name]="'ptTax' + i"
                          />
                        </td>
                        <td>
                          <button class="btn-icon" (click)="removePTSlab(i)">
                            <i class="fas fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <button
                    type="button"
                    class="btn btn-outline-primary"
                    (click)="addPTSlab()"
                  >
                    Add Slab
                  </button>
                </div>
              </form>
            </div>
          </ng-container>
        </div>
      </div>
    </div>
  `,
  styles: [`
     .statutory-components {
        padding: 1.5rem;
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }

      .tabs {
        display: flex;
        flex-direction: column;
      }

      .tab-list {
        display: flex;
        list-style: none;
        padding: 0;
        margin: 0 0 1rem 0;
        border-bottom: 1px solid #ccc;
      }

      .tab-list li {
        padding: 0.5rem 1rem;
        cursor: pointer;
        border: 1px solid transparent;
        border-bottom: none;
      }

      .tab-list li.active {
        font-weight: bold;
        background: #f5f5f5;
        border-color: #ccc;
      }

      .tab-content {
        flex-grow: 1;
      }

      .card {
        padding: 1rem;
        background: #fff;
        border: 1px solid #ddd;
        border-radius: 5px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .form-group {
        margin-bottom: 1rem;
      }

      .form-check {
        margin-top: 1rem;
      }

      .slab-range {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .slab-range input {
        width: 120px;
      }

      .btn-icon {
        background: none;
        border: none;
        cursor: pointer;
        color: #c00;
      }
  `]
})
export class StatutoryComponentsComponent implements OnInit {
  employeeId: string = localStorage.getItem('employeeId') || 'Unknown';
  pfSettings: PFSettings = { rate: 0, maxLimit: 0, enabled: false };
  esiSettings: ESISettings = { rate: 0, maxLimit: 0, enabled: false };
  ptSettings = { slabs: [] as PTSlab[] };
  tabs = [
    { title: 'PF Settings' },
    { title: 'ESI Settings' },
    { title: 'Professional Tax' },
  ];
  activeTab = 0;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.apiService.getSettings().subscribe((settings: any) => {
      if (settings) {
        this.pfSettings = {
          rate: settings.pfRate || 0,
          maxLimit: settings.pfMaxLimit || 0,
          enabled: settings.pfEnabled || false,
        };
        this.esiSettings = {
          rate: settings.esiRate || 0,
          maxLimit: settings.esiMaxLimit || 0,
          enabled: settings.esiEnabled || false,
        };
      }
      alert(this.esiSettings.rate);
    });

    this.apiService.getPTSlabs().subscribe((slabs: PTSlab[]) => {
      this.ptSettings.slabs = slabs || [];
    });
  }

  savePFAndESISettings(): void {
    const settings = {
      pfRate: this.pfSettings.rate,
      pfMaxLimit: this.pfSettings.maxLimit,
      pfEnabled: this.pfSettings.enabled,
      esiRate: this.esiSettings.rate,
      esiMaxLimit: this.esiSettings.maxLimit,
      esiEnabled: this.esiSettings.enabled,
      rCreUserId: this.employeeId,
    };

    this.apiService.saveSettings(settings).subscribe(() => {
      alert('PF & ESI settings saved');
    });
  }

  savePTSlabs(): void {
    for (const slab of this.ptSettings.slabs) {
      this.apiService.savePTSlab(slab).subscribe(() => {
        alert('PT slab saved');
      });
    }
  }

  addPTSlab(): void {
    this.ptSettings.slabs.push({ incomeMin: 0, incomeMax: 0, taxAmount: 0 ,rCreUserId: this.employeeId});
  }

  removePTSlab(index: number): void {
    const slab = this.ptSettings.slabs[index];
    if (slab.id) {
      this.apiService.deletePTSlab(slab.id).subscribe(() => {
        console.log('PT slab deleted');
      });
    }
    this.ptSettings.slabs.splice(index, 1);
  }

  selectTab(index: number): void {
    this.activeTab = index;
  }
}