import { Component, ElementRef, OnInit, ViewChild, computed, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { EmployeeService } from '../employee-service';
import { Employee } from '../employee';

type SortKey = 'id' | 'name' | 'department' | 'salary';

@Component({
  selector: 'app-employee',
  standalone: false,
  templateUrl: './employee.html',
  styleUrl: './employee.css'
})
export class EmployeeComponent implements OnInit {

  @ViewChild('nameInput') nameInput?: ElementRef<HTMLInputElement>;

  employeeForm!: FormGroup;

  // State lives in signals, so the screen updates after every HTTP call
  employees = signal<Employee[]>([]);
  loading = signal(false);
  loadFailed = signal(false);
  saving = signal(false);
  editingId = signal<number | undefined>(undefined);
  confirmingId = signal<number | undefined>(undefined);
  searchTerm = signal('');
  departmentFilter = signal('');
  sortKey = signal<SortKey>('id');
  sortDir = signal<'asc' | 'desc'>('asc');
  page = signal(1);
  pageSize = signal(10);
  pageSizes = [5, 10, 25];
  theme = signal<'light' | 'dark'>('light');
  toast = signal<{ text: string; type: 'success' | 'error' } | null>(null);
  private toastTimer?: ReturnType<typeof setTimeout>;

  departments = computed(() =>
    [...new Set(this.employees().map(e => e.department))].sort((a, b) => a.localeCompare(b)));

  editingEmployee = computed(() =>
    this.employees().find(e => e.id === this.editingId()));

  visibleEmployees = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const dept = this.departmentFilter();
    const key = this.sortKey();
    const dir = this.sortDir() === 'asc' ? 1 : -1;

    return this.employees()
      .filter(e => (!dept || e.department === dept)
        && (!term || e.name.toLowerCase().includes(term)
                  || e.department.toLowerCase().includes(term)))
      .sort((a, b) => {
        const x = a[key] ?? 0;
        const y = b[key] ?? 0;
        return (x < y ? -1 : x > y ? 1 : 0) * dir;
      });
  });

  totalSalary = computed(() =>
    this.visibleEmployees().reduce((sum, e) => sum + e.salary, 0));

  totalPages = computed(() =>
    Math.max(1, Math.ceil(this.visibleEmployees().length / this.pageSize())));

  currentPage = computed(() => Math.min(this.page(), this.totalPages()));

  pagedEmployees = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.visibleEmployees().slice(start, start + this.pageSize());
  });

  pageStart = computed(() =>
    this.visibleEmployees().length === 0 ? 0 : (this.currentPage() - 1) * this.pageSize() + 1);

  pageEnd = computed(() =>
    Math.min(this.currentPage() * this.pageSize(), this.visibleEmployees().length));

  pageList = computed<(number | null)[]>(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    if (total <= 7) { return Array.from({ length: total }, (_, i) => i + 1); }
    const pages = new Set([1, total, current - 1, current, current + 1]);
    const sorted = [...pages].filter(p => p >= 1 && p <= total).sort((a, b) => a - b);
    const list: (number | null)[] = [];
    sorted.forEach((p, i) => {
      if (i > 0 && p - sorted[i - 1] > 1) { list.push(null); }
      list.push(p);
    });
    return list;
  });

  hasFilters = computed(() => !!this.searchTerm().trim() || !!this.departmentFilter());

  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private host: ElementRef<HTMLElement>
  ) {}

  ngOnInit(): void {
    this.applyTheme(this.initialTheme());
    this.employeeForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      department: ['', Validators.required],
      salary: [null, [Validators.required, Validators.min(1)]]
    });
    this.loadEmployees();
  }

  // GET all employees
  loadEmployees(): void {
    this.loading.set(true);
    this.loadFailed.set(false);
    this.employeeService.getAllEmployees().subscribe({
      next: (data) => {
        this.employees.set(data);

        if (!data.some(e => e.department === this.departmentFilter())) {
          this.departmentFilter.set('');
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading employees', error);
        this.loading.set(false);
        this.loadFailed.set(true);
      }
    });
  }

  // POST / PUT
  saveEmployee(): void {
    if (this.employeeForm.invalid) {
      this.employeeForm.markAllAsTouched();
      return;
    }
    const employee: Employee = {
      name: this.employeeForm.value.name.trim(),
      department: this.employeeForm.value.department.trim(),
      salary: Number(this.employeeForm.value.salary)
    };
    const id = this.editingId();
    this.saving.set(true);

    const request = id
      ? this.employeeService.updateEmployee(id, employee)
      : this.employeeService.createEmployee(employee);

    request.subscribe({
      next: () => {
        this.showToast(id ? `${employee.name} updated` : `${employee.name} added`, 'success');
        this.saving.set(false);
        this.resetForm();
        this.loadEmployees();
      },
      error: (error) => {
        console.error('Error saving employee', error);
        this.saving.set(false);
        this.showToast('Could not save. Check that the backend is running.', 'error');
      }
    });
  }

  editEmployee(employee: Employee): void {
    this.confirmingId.set(undefined);
    this.editingId.set(employee.id);
    this.employeeForm.patchValue({
      name: employee.name,
      department: employee.department,
      salary: employee.salary
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.nameInput?.nativeElement.focus({ preventScroll: true });
  }

  askDelete(employee: Employee): void {
    this.confirmingId.set(employee.id);
  }

  cancelDelete(): void {
    this.confirmingId.set(undefined);
  }

  deleteEmployee(employee: Employee): void {
    if (!employee.id) { return; }
    this.confirmingId.set(undefined);

    this.employeeService.deleteEmployee(employee.id).subscribe({
      next: () => {
        this.showToast(`${employee.name} deleted`, 'success');
        if (this.editingId() === employee.id) { this.resetForm(); }
        this.loadEmployees();
      },
      error: (error) => {
        console.error('Error deleting employee', error);
        this.showToast('Could not delete the employee.', 'error');
      }
    });
  }

  resetForm(): void {
    this.employeeForm.reset();
    this.editingId.set(undefined);
  }

  onSearch(value: string): void {
    this.searchTerm.set(value);
    this.page.set(1);
  }

  onDepartment(value: string): void {
    this.departmentFilter.set(value);
    this.page.set(1);
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.departmentFilter.set('');
    this.page.set(1);
  }

  goToPage(n: number): void {
    this.page.set(Math.min(Math.max(1, n), this.totalPages()));
  }

  setPageSize(value: string): void {
    this.pageSize.set(Number(value));
    this.page.set(1);
  }

  toggleTheme(): void {
    this.applyTheme(this.theme() === 'dark' ? 'light' : 'dark');
  }

  private initialTheme(): 'light' | 'dark' {
    try {
      const saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') { return saved; }
    } catch { /* storage unavailable */ }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    this.theme.set(theme);
    this.host.nativeElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch { /* storage unavailable */ }
  }

  sortBy(key: SortKey): void {
    if (this.sortKey() === key) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(key);
      this.sortDir.set('asc');
    }
    this.page.set(1);
  }

  sortMark(key: SortKey): string {
    if (this.sortKey() !== key) { return ''; }
    return this.sortDir() === 'asc' ? '▲' : '▼';
  }

  ariaSort(key: SortKey): 'ascending' | 'descending' | null {
    if (this.sortKey() !== key) { return null; }
    return this.sortDir() === 'asc' ? 'ascending' : 'descending';
  }

  initials(name: string): string {
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
  }

  hue(text: string): number {
    let h = 0;
    for (const ch of text.toLowerCase()) { h = (h * 31 + ch.charCodeAt(0)) % 360; }
    return h;
  }

  dismissToast(): void {
    clearTimeout(this.toastTimer);
    this.toast.set(null);
  }

  private showToast(text: string, type: 'success' | 'error'): void {
    clearTimeout(this.toastTimer);
    this.toast.set({ text, type });
    this.toastTimer = setTimeout(() => this.toast.set(null), 3500);
  }


  get name() { return this.employeeForm.get('name'); }
  get department() { return this.employeeForm.get('department'); }
  get salary() { return this.employeeForm.get('salary'); }
}
