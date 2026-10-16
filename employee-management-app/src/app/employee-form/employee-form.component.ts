import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Employee } from '../../models/employee';
import { EmployeeService } from '../employee.service';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-employee-form',
  imports: [FormsModule, CommonModule],
  templateUrl: './employee-form.component.html',
  styleUrl: './employee-form.component.css'
})
export class EmployeeFormComponent implements OnInit {

  employee: Employee = {
    id: 0,
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: ''
  }

  isEditing: boolean = false;

  errorMessage = "";
  isSaving = false;
  isLoading = false;
  loadFailed = false;

  constructor(
    private employeeService: EmployeeService, 
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((result) => {
      const id = result.get('id');
      this.errorMessage = '';
      this.loadFailed = false;

      this.isEditing = id !== null;

      if (!this.isEditing) {
        this.employee = {
          id: 0, firstName: '', lastName: '', email: '', phone: '', position: ''
        };
        this.errorMessage = '';
        return;
      }

      this.isLoading = true;
      this.employeeService.getEmployeeById(Number(id)).pipe(
        finalize(() => this.isLoading = false)
      ).subscribe({
        next: (result) => this.employee = result,
        error: (err: HttpErrorResponse) => {
          this.loadFailed = true;
          this.errorMessage = err.status === 404
            ? 'This employee could not be found. Return to the directory and select another record.'
            : 'Unable to load this employee. Check your connection and refresh the page.';
        },
      })
    });
  }

  onSubmit(form?: NgForm): void {
    if (this.isSaving || this.isLoading || this.loadFailed) return;
    const required = [this.employee.firstName, this.employee.lastName,
      this.employee.email, this.employee.position];
    if (form?.invalid || required.some(value => !value?.trim()) ||
        !/^[^\s@]+@[^\s@]+$/.test(this.employee.email)) {
      form?.control.markAllAsTouched();
      this.errorMessage = 'Please complete the required fields and enter a valid email address.';
      return;
    }

    this.errorMessage = '';
    this.isSaving = true;
    const request = this.isEditing
      ? this.employeeService.editEmployee(this.employee)
      : this.employeeService.createEmployee(this.employee);
    request.pipe(finalize(() => this.isSaving = false)).subscribe({
      next: () => { this.router.navigate(['/']); },
      error: (error: HttpErrorResponse) => {
        const errors = error.status === 400 ? error.error?.errors : null;
        if (errors && typeof errors === 'object') {
          this.errorMessage = Object.values(errors)
            .flat().filter((message): message is string => typeof message === 'string').join(' ');
        }
        if (!this.errorMessage) {
          this.errorMessage = error.status === 0
            ? 'Unable to reach the server. Check your connection and try saving again.'
            : error.status === 404
              ? 'This employee no longer exists. Return to the directory and refresh.'
              : 'Unable to save this employee. Please try again.';
        }
      }
    });
  }
}
