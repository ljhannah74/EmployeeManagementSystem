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

        var databaseProvider =
            builder.Configuration["DatabaseProvider"] ?? "Sqlite";

        var connectionString =
            builder.Configuration.GetConnectionString("EmployeeDb")
            ?? throw new InvalidOperationException(
                "Connection string 'EmployeeDb' is missing.");

        if (databaseProvider.Equals(
                "SqlServer", StringComparison.OrdinalIgnoreCase))
        {
            builder.Services.AddDbContext<AppDbContext>(options =>
                options.UseSqlServer(
                    connectionString,
                    sql => sql.EnableRetryOnFailure()));
        }
        else if (databaseProvider.Equals(
                     "Sqlite", StringComparison.OrdinalIgnoreCase))
        {
            var sqlite = new SqliteConnectionStringBuilder(connectionString);

            if (!string.IsNullOrWhiteSpace(sqlite.DataSource)
                && sqlite.DataSource != ":memory:")
            {
                sqlite.DataSource = Path.GetFullPath(
                    sqlite.DataSource,
                    builder.Environment.ContentRootPath);
            }

            builder.Services.AddDbContext<AppDbContext>(options =>
                options.UseSqlite(sqlite.ToString()));
        }
        else
        {
            throw new InvalidOperationException(
                $"Unsupported database provider: {databaseProvider}");
        }

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

        if (app.Configuration.GetValue<bool>("Demo:ReadOnly"))
        {
            app.Use(async (context, next) =>
            {
                var isReadRequest =
                    HttpMethods.IsGet(context.Request.Method) ||
                    HttpMethods.IsHead(context.Request.Method) ||
                    HttpMethods.IsOptions(context.Request.Method);

                if (context.Request.Path.StartsWithSegments("/api") &&
                    !isReadRequest)
                {
                    context.Response.StatusCode =
                        StatusCodes.Status403Forbidden;

                    await context.Response.WriteAsJsonAsync(new
                    {
                        message = "This public demo is read-only."
                    });

                    return;
                }

                await next(context);
            });
        }

        using (var scope = app.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            if (db.Database.IsSqlite())
            {
                db.Database.Migrate();
            }
        }

        app.UseHttpsRedirection();
        app.UseCors("MyCors");

        app.UseDefaultFiles();
        app.UseStaticFiles();

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

        if (!app.Environment.IsDevelopment())
        {
            app.MapFallbackToFile("index.html");
        }

        app.Run();
    }
}
