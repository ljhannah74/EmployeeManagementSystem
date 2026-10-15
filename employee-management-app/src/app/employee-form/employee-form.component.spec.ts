import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { EmployeeService } from '../employee.service';
import { EmployeeFormComponent } from './employee-form.component';

describe('EmployeeFormComponent', () => {
  let component: EmployeeFormComponent;
  let service: jasmine.SpyObj<EmployeeService>;
  let params: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  const employee = { id: 7, firstName: 'Alex', lastName: 'Example',
    email: 'alex@example.com', phone: '', position: 'Engineer' };

  beforeEach(() => {
    params = new BehaviorSubject(convertToParamMap({}));
    service = jasmine.createSpyObj('EmployeeService',
      ['getEmployeeById', 'createEmployee', 'editEmployee']);
    service.getEmployeeById.and.returnValue(of(employee));
    service.createEmployee.and.returnValue(of(employee));
    service.editEmployee.and.returnValue(of(employee));
    TestBed.configureTestingModule({ providers: [
      { provide: EmployeeService, useValue: service },
      { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
      { provide: ActivatedRoute, useValue: { paramMap: params } }
    ] });
    component = new EmployeeFormComponent(TestBed.inject(EmployeeService),
      TestBed.inject(Router), TestBed.inject(ActivatedRoute));
  });

  it('does not fetch a record in create mode', () => {
    component.ngOnInit();
    expect(component.isEditing).toBeFalse();
    expect(service.getEmployeeById).not.toHaveBeenCalled();
  });

  it('loads the route employee in edit mode', () => {
    params.next(convertToParamMap({ id: '7' }));
    component.ngOnInit();
    expect(component.isEditing).toBeTrue();
    expect(service.getEmployeeById).toHaveBeenCalledOnceWith(7);
    expect(component.employee).toEqual(employee);
  });

  it('resets the edited record when entering create mode', () => {
    params.next(convertToParamMap({ id: '7' }));
    component.ngOnInit();
    params.next(convertToParamMap({}));
    expect(component.employee.id).toBe(0);
    expect(component.employee.firstName).toBe('');
    expect(component.isEditing).toBeFalse();
    expect(service.getEmployeeById).toHaveBeenCalledTimes(1);
  });

  it('submits new records through create', () => {
    component.ngOnInit();
    component.onSubmit();
    expect(service.createEmployee).toHaveBeenCalledWith(component.employee);
    expect(service.editEmployee).not.toHaveBeenCalled();
  });

  it('submits existing records through edit', () => {
    params.next(convertToParamMap({ id: '7' }));
    component.ngOnInit();
    component.onSubmit();
    expect(service.editEmployee).toHaveBeenCalledWith(employee);
    expect(service.createEmployee).not.toHaveBeenCalled();
  });
});
