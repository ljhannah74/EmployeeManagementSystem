import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
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
    TestBed.configureTestingModule({ imports: [EmployeeFormComponent], providers: [
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
    component.employee = { ...employee, id: 0 };
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

  it('rejects empty and whitespace-only required fields', () => {
    component.employee = { ...employee, firstName: '   ' };
    component.onSubmit();
    expect(service.createEmployee).not.toHaveBeenCalled();
    expect(component.errorMessage).toContain('required');
  });

  it('rejects a malformed email', () => {
    component.employee = { ...employee, email: 'invalid' };
    component.onSubmit();
    expect(service.createEmployee).not.toHaveBeenCalled();
  });

  it('blocks a second submission while saving and allows retry after failure', () => {
    const pending = new Subject<typeof employee>();
    service.createEmployee.and.returnValue(pending);
    component.employee = { ...employee, id: 0 };
    component.onSubmit();
    component.onSubmit();
    expect(service.createEmployee).toHaveBeenCalledTimes(1);
    expect(component.isSaving).toBeTrue();
    pending.error(new HttpErrorResponse({ status: 0 }));
    expect(component.isSaving).toBeFalse();
    expect(component.employee.email).toBe(employee.email);
    expect(component.errorMessage).toContain('Unable to reach');
    service.createEmployee.and.returnValue(of(employee));
    component.onSubmit();
    expect(service.createEmployee).toHaveBeenCalledTimes(2);
  });

  it('shows API validation messages without losing entered data', () => {
    service.createEmployee.and.returnValue(throwError(() =>
      new HttpErrorResponse({ status: 400, error: {
        errors: { Email: ['Enter a valid email address.'] }
      } })));
    component.employee = { ...employee };
    component.onSubmit();
    expect(component.errorMessage).toBe('Enter a valid email address.');
    expect(component.employee.firstName).toBe('Alex');
    expect(component.isSaving).toBeFalse();
  });

  it('blocks saving when the edited employee could not be loaded', () => {
    service.getEmployeeById.and.returnValue(throwError(() =>
      new HttpErrorResponse({ status: 404 })));
    params.next(convertToParamMap({ id: '7' }));
    component.ngOnInit();
    component.onSubmit();
    expect(component.loadFailed).toBeTrue();
    expect(component.errorMessage).toContain('could not be found');
    expect(service.editEmployee).not.toHaveBeenCalled();
  });

  it('shows required field messages after submitting the empty form', fakeAsync(() => {
    const fixture = TestBed.createComponent(EmployeeFormComponent);
    fixture.detectChanges();
    tick();
    fixture.nativeElement.querySelector('form').dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('First name is required.');
    expect(fixture.nativeElement.textContent).toContain('Last name is required.');
    expect(service.createEmployee).not.toHaveBeenCalled();
  }));

  it('disables the form while a save request is pending', fakeAsync(() => {
    const pending = new Subject<typeof employee>();
    service.createEmployee.and.returnValue(pending);
    const fixture = TestBed.createComponent(EmployeeFormComponent);
    fixture.detectChanges();
    fixture.componentInstance.employee = { ...employee };
    fixture.detectChanges();
    tick();
    fixture.componentInstance.onSubmit();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('fieldset').disabled).toBeTrue();
    expect(fixture.nativeElement.querySelector('button').textContent).toContain('Saving');
    pending.error(new HttpErrorResponse({ status: 500 }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('fieldset').disabled).toBeFalse();
    expect(fixture.nativeElement.querySelector('[role=alert]').textContent)
      .toContain('Unable to save');
  }));
});
