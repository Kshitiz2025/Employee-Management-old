package com.example.web_demo.service;

import com.example.web_demo.model.Employee;
import com.example.web_demo.repository.EmployeeRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class EmployeeService {

    @Autowired
    private EmployeeRepo employeeRepo;

    // Create Employee (changed to lowercase 'c' to match controller)
    public Employee createEmployee(Employee employee) {
        return employeeRepo.save(employee);
    }

    // Get All Employees
    public List<Employee> getAllEmployees() {
        return employeeRepo.findAll();
    }

    // Get Employee By Id
    public Employee getEmployeeById(Long id) {
        Optional<Employee> opt = employeeRepo.findById(id);
        if (opt.isPresent()) {
            return opt.get();
        }
        return null;
    }

    // Update Employee
    public Employee updateEmployee(Long id, Employee employeeDetails) {
        Employee employee = getEmployeeById(id);
        if (employee != null) {
            employee.setName(employeeDetails.getName());
            employee.setDepartment(employeeDetails.getDepartment());
            employee.setSalary(employeeDetails.getSalary());
            return employeeRepo.save(employee);
        }
        return null;
    }

    // Delete Employee. Returns true if an employee was found and deleted.
    public boolean deleteEmployee(Long id) {
        Employee employee = getEmployeeById(id);
        if (employee != null) {
            employeeRepo.delete(employee);
            return true;
        }
        return false;
    }
}