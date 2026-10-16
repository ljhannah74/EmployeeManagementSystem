# Employee Management System

A full-stack employee directory built with Angular and ASP.NET Core. The project demonstrates an Angular interface exchanging employee records with a C# REST API through a service and repository layer.

**Status:** Learning and portfolio project in development. CRUD endpoints and screens are implemented; this is not a production-ready HR system. See [known limitations](#known-limitations) before running it.

## Features

- List employees and their contact and position details.
- Create and edit employee records through a shared Angular form.
- Delete an employee from the directory.
- Exchange JSON between Angular HttpClient and the ASP.NET Core API.
- Explore the API with Swagger UI in the Development environment.
- Validate required employee fields and email format in both the form and API.
- Show field-level messages, preserve input on save failure, and prevent duplicate saves.

Employee records contain an ID, first name, last name, email, phone, and position.

## Technology

| Area | Implementation |
| --- | --- |
| Frontend | Angular 19.2, TypeScript 5.7, RxJS, template-driven forms |
| Backend | C#, ASP.NET Core targeting .NET 9 |
| Data access | Entity Framework Core 9.0.4 with the SQLite provider |
| API documentation | Swagger UI through Swashbuckle |
| Frontend testing | Jasmine and Karma; initial scaffold tests |

Employee records are stored in a local SQLite database and survive API restarts. No separate database server is required.

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

On first launch, the API applies the checked-in EF Core migrations and creates `EmployeeManagement/employees.db`. Relative database paths resolve against the backend content root, so the normal launch commands use the same file. Keep this terminal running.

The connection string is configured under `ConnectionStrings:EmployeeDb` in `EmployeeManagement/appsettings.json`. Override it with the `ConnectionStrings__EmployeeDb` environment variable if needed. The default database and its journal files are excluded from Git; also exclude any custom database path you choose.

Schema changes should use a new EF Core migration (using `dotnet-ef` 9.0.4), for example:

```bash
dotnet ef migrations add DescribeSchemaChange --project EmployeeManagement/EmployeeManagement.csproj
```

Startup applies pending migrations automatically for this local portfolio app. Back up the database before schema changes; a production deployment should apply migrations as a controlled deployment step.

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
5. Create another fictional record, restart the API, and confirm that it remains in the directory.

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

The frontend includes 12 form regression tests covering create/edit initialization, route reset, submit selection, invalid input, duplicate saves, retries, server validation messages, load failures, and template behavior. Other tests are still initial scaffolds, and there is no separate backend test project.

Validation from the earlier form update (frontend unchanged by the SQLite change):

- Backend Release build: passed, with five existing nullable-property warnings in the employee model.
- Frontend production build: passed, with initial bundle-budget and Bootstrap selector warnings.
- TypeScript test compilation: passed.
- Live API smoke check: create, retrieve, update, list, delete, and deletion verification passed using fictional data.
- Karma execution: attempted, but Chrome could not launch because this execution environment denied a required socket operation. The tests have not been confirmed passing.
- Screenshots and end-to-end browser verification remain pending; no simulated screenshots are included.

SQLite validation:
- Backend Release build passed with the same five existing nullable-property warnings.
- A fresh temporary SQLite database was created through the initial migration.
- Live API create, retrieve, update, list, and delete passed using fictional data.
- Created records survived an API restart; deleted records remained absent after another restart.
- Repeated startup with an existing migrated database succeeded.

## Known limitations

- **Local storage:** SQLite uses a local file. Database backups and production migration/deployment procedures are not implemented.
- **Errors:** the employee form handles load/save failures, and the API returns validation errors and missing-record responses. Directory-level error handling and concurrent-delete race handling remain to be improved.
- **Access control:** authentication and authorization are not implemented. Use fictional data in local development.
- **Testing:** meaningful API and frontend behavior tests remain to be added.

## Next improvements

1. Run the browser tests and verify the complete create/edit/delete workflow in the UI.
2. Improve directory-level error messages and concurrent-update handling.
3. Test service HTTP requests, API responses, and form behavior.
4. Add automated database integration tests.
5. Expand CI coverage as service and directory tests are implemented.
6. Add screenshots captured from the running application using fictional data.


### Validation and error handling update

First name, last name, email, and position are required; phone is optional.
Whitespace-only required values and malformed email addresses are rejected.
The API uses ASP.NET Core validation responses (HTTP 400), including when callers bypass the UI.
Saving disables the form until the request completes. Failures keep entered values and display a retry message.
Failed edit loads prevent saving an unloaded record. Updating or deleting a missing record returns HTTP 404.

Validation: backend Release build passed with no warnings; frontend production build and test TypeScript compilation passed.
Live SQLite API checks passed for empty, whitespace-only, and null required fields, malformed email, invalid updates preserving data, valid CRUD, and missing update/delete records.
The focused Karma run was attempted, but Chrome launch was blocked by this execution environment's socket restriction; browser test execution remains unverified.

To run only the employee-form tests locally:

```bash
npm test -- --watch=false --browsers=ChromeHeadless --include=src/app/employee-form/employee-form.component.spec.ts
```

## Continuous integration

[![CI](https://github.com/ljhannah74/EmployeeManagementSystem/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/ljhannah74/EmployeeManagementSystem/actions/workflows/ci.yml)

GitHub Actions runs on pull requests targeting `master`, pushes to `master`, and manual runs from the Actions tab.

- **Backend build:** installs .NET 9, restores dependencies, and builds the solution in Release mode. There is no backend test project yet.
- **Frontend build and form tests:** uses Node.js 22, installs dependencies from the lockfile with `npm ci`, builds Angular for production, and runs the 12 employee-form tests in headless Chrome on the Ubuntu runner.
- **Test scope:** service, directory, and app scaffold specs are not yet included in CI. A green result covers the two builds and the employee-form tests, rather than the entire test suite.
- Jobs have time limits, read-only repository permissions, and cancellation of superseded runs. No secrets, database server, or deployment configuration are required.

Open **Actions → CI** or a pull request's **Checks** tab to see results and expand a failed step for its log.
These checks report failures but do not enforce merge blocking until a repository ruleset requires them.
