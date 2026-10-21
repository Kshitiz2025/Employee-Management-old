# Employee Management

Angular frontend, Spring Boot REST API and MySQL database.

    frontend/   Angular app (http://localhost:4200)
    backend/    Spring Boot API (http://localhost:8080)
    database/   MySQL schema (schema.sql)

## Run it

1. Create the database: run database/schema.sql in MySQL (or let the backend create the table).
2. Backend: copy backend/src/main/resources/application-local.properties.example to
   application-local.properties, set your MySQL password, then run `.\mvnw.cmd spring-boot:run` inside backend.
3. Frontend: inside frontend run `npm install` then `npm start`, and open http://localhost:4200.