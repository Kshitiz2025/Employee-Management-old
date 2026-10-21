import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Employee } from './employee';

@Injectable({
providedIn: 'root'
})
export class EmployeeService {

private apiUrl = 'http://localhost:8080';

constructor(private http: HttpClient) {}

createEmployee(employee: Employee): Observable<Employee> {
return this.http.post<Employee>(
`${this.apiUrl}/create`,
employee
);
}

getAllEmployees(): Observable<Employee[]> {
return this.http.get<Employee[]>(
`${this.apiUrl}/list`
);
}

getEmployeeById(id: number): Observable<Employee> {
return this.http.get<Employee>(
`${this.apiUrl}/list/${id}`
);
}

updateEmployee(id: number, employee: Employee): Observable<Employee> {
return this.http.put<Employee>(
`${this.apiUrl}/update/${id}`,
employee
);
}

deleteEmployee(id: number): Observable<void> {
return this.http.delete<void>(
`${this.apiUrl}/rm/${id}`
);
}
}
