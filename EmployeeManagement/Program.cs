using EmployeeManagement.Data;
using EmployeeManagement.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.Sqlite;

namespace EmployeeManagement;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        var connectionString = builder.Configuration.GetConnectionString("EmployeeDb")
            ?? throw new InvalidOperationException("Connection string 'EmployeeDb' is missing.");
        var sqlite = new SqliteConnectionStringBuilder(connectionString);
        if (!string.IsNullOrWhiteSpace(sqlite.DataSource) && sqlite.DataSource != ":memory:")
        {
            sqlite.DataSource = Path.GetFullPath(sqlite.DataSource, builder.Environment.ContentRootPath);
        }

        builder.Services.AddDbContext<AppDbContext>(
            options => options.UseSqlite(sqlite.ToString())
        );

        builder.Services.AddCors(options =>
        {
            options.AddPolicy("MyCors", builder =>
            {
                builder.WithOrigins("http://localhost:4200")
                .AllowAnyMethod()
                .AllowAnyHeader();
            });
        });

        builder.Services.AddScoped<IEmployeeRepository, EmployeeRepository>();

        builder.Services.AddControllers();

        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen();

        var app = builder.Build();

        // Apply the checked-in schema migrations before accepting requests.
        using (var scope = app.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Database.Migrate();
        }

        app.UseCors("MyCors");

        app.MapControllers();

        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI(c =>
            {
                c.SwaggerEndpoint("/swagger/v1/swagger.json", "EmployeeManagement v1");
                c.RoutePrefix = string.Empty; // Set Swagger UI at the app's root
            });
        }

        app.Run();
    }
}
