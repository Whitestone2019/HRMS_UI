<!-- Single Progress Bar -->
<div class="step-container">
  <div class="step-wrapper">
    <!-- Step 1: User -->
    <div class="step" [class.active-step]="true">
      <div class="circle circle-completed">1</div>
      <span class="label label-completed">USER</span>
    </div>

    <!-- Line 1 -->
    <div class="line" [class]="getLineClass(0)"></div>

    <!-- Step 2: Manager -->
    <div class="step" [class.active-step]="getProgressStep(0) >= 1">
      <div class="circle" [class]="getCircleClass(0, 1)">2</div>
      <span class="label" [class]="getLabelClass(0, 1)">MANAGER</span>
    </div>

    <!-- Line 2 -->
    <div class="line" [class]="getLineClass(1)"></div>

    <!-- Step 3: HR Round 1 -->
    <div class="step" [class.active-step]="getProgressStep(0) >= 2">
      <div class="circle" [class]="getCircleClass(0, 2)">3</div>
      <span class="label" [class]="getLabelClass(0, 2)">HR Round 1</span>
    </div>

    <!-- Line 3 -->
    <div class="line" [class]="getLineClass(2)"></div>

    <!-- Step 4: System Admin -->
    <div class="step" [class.active-step]="getProgressStep(0) >= 3">
      <div class="circle" [class]="getCircleClass(0, 3)">4</div>
      <span class="label" [class]="getLabelClass(0, 3)">System Admin</span>
    </div>

    <!-- Line 4 -->
    <div class="line" [class]="getLineClass(3)"></div>

    <!-- Step 5: HR Round 2 -->
    <div class="step" [class.active-step]="getProgressStep(0) >= 4">
      <div class="circle" [class]="getCircleClass(0, 4)">5</div>
      <span class="label" [class]="getLabelClass(0, 4)">HR Round 2</span>
    </div>

    <!-- Line 5 -->
    <div class="line" [class]="getLineClass(4)"></div>

    <!-- Step 6: Approved -->
    <div class="step" [class.active-step]="getProgressStep(0) >= 5">
      <div class="circle" [class]="getCircleClass(0, 5)">✓</div>
      <span class="label" [class]="getLabelClass(0, 5)">APPROVED</span>
    </div>
  </div>
</div>

<!-- Progress Status Info -->
<div class="progress-info">
  <p><strong>Workflow Status Legend:</strong></p>
  <div class="status-legend">
    <span class="legend-item completed">● Completed</span>
    <span class="legend-item active">● In Progress</span>
    <span class="legend-item onhold">● On Hold</span>
    <span class="legend-item rejected">● Rejected</span>
    <span class="legend-item pending">● Pending</span>
  </div>
</div>

<!-- Button -->
<div class="btn-container">
  <button class="go-btn" (click)="createNewExitForm()">Go to Exit Form</button>
</div>

<hr />

<!-- Loading -->
<div *ngIf="loading" class="loading">Loading exit forms...</div>

<!-- TABLE VIEW -->
<div *ngIf="!loading && exitForms.length > 0" class="table-container">
  <table class="exit-table">
    <thead>
      <tr>
        <th>Employee ID</th>
        <th>Employee Name</th>
        <th>Notice Start</th>
        <th>Notice End</th>
        <th>Reason</th>
        <th>Status</th>
        <th>Progress</th>
        <th>Current Stage</th>
        <th>Comments</th>
        <th>Attachment</th>
        <th>Action</th>
      </tr>
    </thead>

    <tbody>
      <tr *ngFor="let form of exitForms">
        <td>{{ form.employeeId }}</td>
        <td>{{ form.employeeName }}</td>
        <td>{{ formatDate(form.noticeStartDate) }}</td>
        <td>{{ formatDate(form.noticeEndDate) }}</td>
        <td>{{ form.reason }}</td>
        <td>
          <span class="status-badge" [class]="getStatusClass(form.status)">
            {{ getStatusText(form.status) }}
          </span>
        </td>
        <td>
          <div class="mini-progress">
            <div class="progress-bar">
              <div class="progress-fill" [class]="getProgressFillClass(form.status)" [style.width.%]="getProgressPercentage(form.status)"></div>
            </div>
            <span class="progress-text">{{ getProgressPercentage(form.status) }}%</span>
          </div>
        </td>
        <td>
          <span class="current-stage">{{ getCurrentStage(form.status) }}</span>
        </td>
        <td>{{ form.comments }}</td>
        <td>{{ form.attachment || '-' }}</td>
        <td>
          <button class="view-btn" (click)="viewExitForm(form)">View</button>
        </td>
      </tr>
    </tbody>
  </table>
</div>

<div *ngIf="!loading && exitForms.length === 0" class="no-data">
  No exit forms found.
</div>