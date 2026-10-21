package com.example.web_demo.repository;
import com.example.web_demo.model.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
//Long
//predefined
public interface EmployeeRepo extends JpaRepository<Employee, Long> {

}
