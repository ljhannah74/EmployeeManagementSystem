# Employee Management System

A full-stack employee directory built with Angular and ASP.NET Core. The project demonstrates an Angular interface exchanging employee records with a C# REST API through a service and repository layer.

**Status:** Learning and portfolio project in development. CRUD endpoints and screens are implemented; this is not a production-ready HR system. See [known limitations](#known-limitations) before running it.

## Features

- List employees and their contact and position details.
- Create and edit employee records through a shared Angular form.
- Delete an employee from the directory.
- Exchange JSON between Angular HttpClient and the ASP.NET Core API.
- Explore the API with Swagger UI in the Development environment.
- Display create/update request errors in the form.

Employee records contain an ID, first name, last name, email, phone, and position.

## Technology

| Area | Implementation |
| --- | --- |
| Frontend | Angular 19.2, TypeScript 5.7, RxJS, template-driven forms |
| Backend | C#, ASP.NET Core targeting .NET 9 |
| Data access | Entity Framework Core 9.0.4 with the InMemory provider |
| API documentation | Swagger UI through Swashbuckle |
| Frontend testing | Jasmine and Karma; initial scaffold tests |

**Storage is temporary.** There is no SQL Server or SQLite setup for this version. All employee data is lost when the API process stops.

## Structure

- `EmployeeManagement/` — ASP.NET Core application.
  - `Controllers/EmployeeController.cs` — HTTP endpoints.
  - `Repositories/` — repository interface and implementation.
  - `Data/AppDbContext.cs` — EF Core context.
  - `Models/Employee.cs` — employee entity.
- `employee-management-app/` — Angular application.
  - `src/app/employee-table/` — directory and edit/delete actions.
  - `src/app/employee-form/` — create/edit form.
  - `src/app/employee.service.ts` — API requests.
  - `src/models/` — frontend employee type.
  - `src/environments/` — API base URL configuration.

The request flow is Angular component → EmployeeService → EmployeeController → IEmployeeRepository → AppDbContext.

## Run locally

### Prerequisites

- Git.
- .NET 9 SDK, matching the backend target framework.
- Node.js and npm compatible with Angular 19.2; consult the [Angular version compatibility table](https://angular.dev/reference/versions).
- Chrome or Chromium if running the Karma browser tests.

The frontend production build and backend Release build have been verified. See the validation notes below for the remaining browser-testing limitation.

### 1. Clone the repository

```bash
git clone https://github.com/ljhannah74/EmployeeManagementSystem.git
cd EmployeeManagementSystem
```

### 2. Start the API

From the repository root:

```bash
dotnet restore EmployeeManagementSystem.sln
dotnet run --project EmployeeManagement/EmployeeManagement.csproj --launch-profile http
```

Keep this terminal running.

- API: `http://localhost:5235/api/employee`
- Swagger UI: `http://localhost:5235/`

The `http` launch profile enables Development mode. Swagger UI is configured at the application root, rather than at `/swagger`.

### 3. Start Angular

Open a second terminal from the repository root:

```bash
cd employee-management-app
npm ci
npm start
```

Open `http://localhost:4200/`.

The frontend API base URL is configured in `employee-management-app/src/environments/environment.ts` as `http://localhost:5235/api`. The backend CORS policy permits `http://localhost:4200`. If you change either port, update the matching configuration.

### 4. Try the workflow

1. Create an employee using fictional contact information.
2. Confirm that the employee appears in the directory.
3. Edit the record and verify the changes.
4. Delete the record and confirm it disappears.
5. Restart the API to observe that in-memory records are cleared.

## API endpoints

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/employee` | List all employees |
| GET | `/api/employee/{id}` | Retrieve one employee |
| POST | `/api/employee` | Create an employee |
| PUT | `/api/employee/{id}` | Update an employee |
| DELETE | `/api/employee/{id}` | Delete an employee |

Example create request body, using fictional data:

```json
{
  "firstName": "Alex",
  "lastName": "Example",
  "email": "alex@example.com",
  "phone": "202-555-0142",
  "position": "Software Engineer"
}
```

The API generates the ID when creating a record. An update body must include an `id` matching the route ID.

## Build and tests

Backend build, from the repository root:

```bash
dotnet build EmployeeManagementSystem.sln --configuration Release
```

Frontend build and tests, from `employee-management-app/`:

```bash
npm run build
npm test -- --watch=false --browsers=ChromeHeadless
```

The frontend includes five form regression tests for create/edit initialization, resetting the form on route changes, and selecting the correct submit operation. Other tests are still initial scaffolds, and there is no separate backend test project.

Validation performed for this update:

- Backend Release build: passed, with five existing nullable-property warnings in the employee model.
- Frontend production build: passed, with initial bundle-budget and Bootstrap selector warnings.
- TypeScript test compilation: passed.
- Live API smoke check: create, retrieve, update, list, delete, and deletion verification passed using fictional data.
- Karma execution: attempted, but Chrome could not launch because this execution environment denied a required socket operation. The tests have not been confirmed passing.
- Screenshots and end-to-end browser verification remain pending; no simulated screenshots are included.

## Known limitations

- **Temporary storage:** the EF Core InMemory provider does not provide durable storage or production relational-database behavior.
- **Validation and errors:** field validation, missing-record handling, and consistent API error responses need improvement. Some failures are logged only to the browser console.
- **Access control:** authentication and authorization are not implemented. Use fictional data in local development.
- **Testing:** meaningful API and frontend behavior tests remain to be added.

## Next improvements

1. Run the browser tests and verify the complete create/edit/delete workflow in the UI.
2. Add field validation and consistent error messages.
3. Test service HTTP requests, API responses, and form behavior.
4. Add persistent storage and document database setup.
5. Add GitHub Actions checks for builds and tests.
6. Add screenshots captured from the running application using fictional data.
