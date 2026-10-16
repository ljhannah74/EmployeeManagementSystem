using EmployeeManagement.Models;
using EmployeeManagement.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagement.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EmployeeController : ControllerBase
    {
        private readonly IEmployeeRepository _employeeRepository;
        public EmployeeController(IEmployeeRepository employeeRepository)
        {
            _employeeRepository = employeeRepository;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Employee>>> GetAllEmployeesAsync()
        {
            return Ok(await _employeeRepository.GetAllAsync());
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Employee>> GetEmployeeById(int id)
        {
            var employee = await _employeeRepository.GetByIdAsync(id);
            if (employee == null)
            {
                return NotFound();
            }
            return Ok(employee);
        }

        [HttpPost]
        public async Task<ActionResult<Employee>> CreateEmployee(Employee employee)
        {
            await _employeeRepository.AddEmployeeAsync(employee);
            return CreatedAtAction(nameof(GetEmployeeById), new { id = employee.Id }, employee);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteEmployeeById(int id)
        {
            if (await _employeeRepository.GetByIdAsync(id) == null)
                return NotFound();
            await _employeeRepository.DeleteEmployeeAsync(id);
            return NoContent();
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<Employee>> UpdateEmployeeAsync(int id, Employee employee)
        {
            if (id != employee.Id)
            {
                return BadRequest();
            }

            var existing = await _employeeRepository.GetByIdAsync(id);
            if (existing == null) return NotFound();
            existing.FirstName = employee.FirstName;
            existing.LastName = employee.LastName;
            existing.Email = employee.Email;
            existing.Phone = employee.Phone;
            existing.Position = employee.Position;
            await _employeeRepository.UpdateEmployeeAsync(existing);
            return CreatedAtAction(nameof(GetEmployeeById), new { id = employee.Id }, employee);
        }
    }
}
