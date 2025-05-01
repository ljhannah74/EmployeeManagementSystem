import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Employee } from '../../models/employee';
import { EmployeeService } from '../employee.service';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

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

  constructor(
    private employeeService: EmployeeService, 
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((result) => {
      const id = result.get('id');

      if(id) 
        this.isEditing = true;
    
      this.employeeService.getEmployeeById(Number(id)).subscribe({
        next: (result) => this.employee = result,
        error: (err) => console.error("Error loading employee", err),
      })
    });
  }

  onSubmit() : void {
    if(this.isEditing) {
      this.employeeService.editEmployee(this.employee).subscribe({
        next: () => {
          this.router.navigate(['/']);
        },
        error: (error) => {
          console.error('Error updating employee:', error);
          this.errorMessage = `Error occured: (${error.status})`;
        },
      });
      return;
    } else {
     
    this.employeeService.createEmployee(this.employee).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('Error creating employee:', error);
        this.errorMessage = `Error occured: (${error.status})`;
      },
    });
  }
  }
}
