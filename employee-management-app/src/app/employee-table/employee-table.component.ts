import { Component, OnInit } from '@angular/core';
import { Employee } from '../../models/employee';// Adjust the path as needed
import { EmployeeService } from '../employee.service'; // Adjust the path as needed
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'employee-table',
  imports: [CommonModule],
  templateUrl: './employee-table.component.html',
  styleUrl: './employee-table.component.css'
})
export class EmployeeTableComponent {

  employees: Employee[] = [];

  constructor(private employeeService: EmployeeService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.getEmployees();
  }

  getEmployees(): void {
    this.employeeService.getEmployees().subscribe((data: Employee[]) => {
      this.employees = data;
    });
  }

  deleteEmployee(id: number): void {
    this.employeeService.deleteEmployee(id).subscribe({
      next: () => {
        this.employees = this.employees.filter(e => e.id !== id);
      },
      error: (err) => {
        console.error('Error deleting employee:', err);
      }
    });
  }

  editEmployee(id: number): void {
    this.router.navigate(['/edit', id]);
  }
}
