import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common'; // Importing CommonModule here
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ApiService } from '../../../api.service';
import { ActivatedRoute, Router } from '@angular/router';


@Component({
  selector: 'app-expense-form',
  standalone: true,  // Since it's standalone, we use this
  imports: [
    CommonModule,        // Importing CommonModule for *ngIf
    ReactiveFormsModule, // For reactive forms and formGroup
    HttpClientModule     // For making HTTP requests
  ],
  templateUrl: './expense-form.component.html',
  styleUrls: ['./expense-form.component.css']
})
export class ExpenseFormComponent {
  username: string = localStorage.getItem('username') || 'Unknown';
  employeeId: string = localStorage.getItem('employeeId') || 'Unknown';
  expenseForm: FormGroup;
  uploadedReceipt: string | ArrayBuffer | null = null; // For preview


  constructor(private fb: FormBuilder, private apiService: ApiService, private router: Router, private route: ActivatedRoute) {
    this.expenseForm = this.fb.group({
      expenseId: [null],
      date: ['', Validators.required],
      empid: ['', Validators.required],
      category: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(0)]],
      currency: ['USD', Validators.required],
      description: ['', Validators.required],
      receipt: [null, Validators.required]
    });

  }


  ngOnInit() {
    this.expenseForm.patchValue({ empid: this.employeeId });

    this.route.queryParams.subscribe(params => {
      if (params['expenseId']) {
        this.apiService.getExpenses().subscribe((expenses) => {
          const selectedExpense = expenses.find(e => e.expenseId === params['expenseId']);
          if (selectedExpense) {
            let formattedDate = selectedExpense.date;
            if (selectedExpense.date && !isNaN(Date.parse(selectedExpense.date))) {
              formattedDate = new Date(selectedExpense.date).toISOString().split('T')[0]; // Get YYYY-MM-DD
            }

            this.expenseForm.patchValue({
              expenseId: selectedExpense.expenseId,
              date: formattedDate,
              category: selectedExpense.category,
              amount: selectedExpense.amount,
              currency: selectedExpense.currency,
              description: selectedExpense.description,
              empid: selectedExpense.empId

            });

            // Fetch and set the receipt URL
            this.apiService.getReceiptUrl(selectedExpense.expenseId).subscribe((blob: Blob) => {
              const fileUrl = URL.createObjectURL(blob);
              this.uploadedReceipt = fileUrl;
            });

          }
        });
      }
    });
  }



  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input?.files?.[0]) {
      const file = input.files[0];
      const reader = new FileReader();

      reader.onload = () => {
        this.uploadedReceipt = reader.result as string; // Store base64 URL for preview
      };

      reader.readAsDataURL(file); // Read the file as a data URL

      // Update the form control with the file
      this.expenseForm.patchValue({ receipt: file });
      this.expenseForm.get('receipt')?.updateValueAndValidity();
    }
  }

  /**
   * Opens a new tab to display the uploaded receipt.
   */


  viewReceipt(): void {
    if (this.uploadedReceipt) {
      // console.log('this.uploadedReceipt', this.uploadedReceipt);
      const receiptWindow = window.open('', '_blank');
      receiptWindow?.document.write(`
        <html>
          <body>
            <h2>Receipt Preview</h2>
            <img src="${this.uploadedReceipt}" alt="Receipt" style="max-width: 100%; height: auto;">
          </body>
        </html>
      `);
    }
  }
  /**
   * Submits the expense form with FormData, including the file.
   */
  onSubmit(): void {
    console.log('Form Valid:', this.expenseForm.valid);
    console.log('Form Errors:', this.expenseForm.errors);
    console.log('Form Value:', this.expenseForm.value);
    if (this.expenseForm.valid) {
      const formData = new FormData();

      // Construct expenseDetails object
      const expenseDetails = {
        employeeName: this.username,
        empId: this.employeeId,
        date: this.expenseForm.get('date')?.value,
        category: this.expenseForm.get('category')?.value,
        amount: this.expenseForm.get('amount')?.value,
        currency: this.expenseForm.get('currency')?.value,
        description: this.expenseForm.get('description')?.value,
        receipt: this.expenseForm.get('receipt')?.value,
        expenseId: this.expenseForm.get('expenseId')?.value,
      };

      console.log('expenseDetails', expenseDetails);

      // Append expenseDetails as JSON string
      formData.append('expenseDetails', JSON.stringify(expenseDetails));

      // Append receipt file if available
      const file = this.expenseForm.get('receipt')?.value;
      if (file instanceof File) {
        formData.append('receipt', file);
      } else {
        alert('Please upload a valid receipt file.');
        return;
      }

      console.log('Submitting expense data:', formData);

      // API call (do not manually set the Content-Type header)
      this.apiService.submitExpense(formData).subscribe({
        next: (response) => {
          alert('Expense submitted successfully!');
          console.log('Response from API:', response);
          this.expenseForm.reset();
          this.uploadedReceipt = null; // Reset receipt preview
          this.router.navigate(['/expences/dashboardexp/exp']).then(() => {
          });
        },
        error: (error) => {
          alert('Error submitting expense.');
          console.error('Error from API:', error);
        }
      });
    } else {
      alert('Please fill in all required fields.');
    }
  }


  cancel() {
    this.router.navigate(['/expences/dashboardexp/exp']);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input?.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();

      reader.onload = () => {
        this.uploadedReceipt = reader.result; // Store the base64 representation of the file
      };

      reader.readAsDataURL(file); // Read the file for preview purposes

      // Patch the file into the form
      this.expenseForm.patchValue({ receipt: file });
      this.expenseForm.get('receipt')?.updateValueAndValidity();
    }
  }
}
