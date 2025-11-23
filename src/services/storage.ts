// Storage keys
const STORAGE_KEYS = {
  INVENTORY: 'tess_inventory',
  SALES: 'tess_sales',
  USERS: 'tess_users',
  SALARIES: 'tess_salaries'
} as const;

// Initialize default data if not exists
const initializeStorage = () => {
  if (!localStorage.getItem(STORAGE_KEYS.INVENTORY)) {
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SALES)) {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SALARIES)) {
    localStorage.setItem(STORAGE_KEYS.SALARIES, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    // Default admin and employee users
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([
      {
        id: '1',
        username: 'admin',
        password: 'admin', // In a real app, this would be hashed
        role: 'admin',
        name: 'Administrator'
      },
      {
        id: '2',
        username: 'admin1',
        password: 'admin1', // In a real app, this would be hashed
        role: 'admin',
        name: 'Co-Admin '
      },
    ]));
  }
};

// Initialize storage when the module is loaded
initializeStorage();

// Generic storage functions
const getItems = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error getting items from ${key}:`, error);
    return [];
  }
};

const saveItems = <T>(key: string, items: T[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch (error) {
    console.error(`Error saving items to ${key}:`, error);
  }
};

// Inventory operations
export const inventoryService = {
  getAll: (): Product[] => getItems<Product>(STORAGE_KEYS.INVENTORY),
  
  getById: (id: string): Product | undefined => {
    const items = getItems<Product>(STORAGE_KEYS.INVENTORY);
    return items.find(item => item.id === id);
  },
  
  create: (item: Omit<Product, 'id'>): Product => {
    const items = getItems<Product>(STORAGE_KEYS.INVENTORY);
    const newItem = { ...item, id: Date.now().toString() };
    saveItems(STORAGE_KEYS.INVENTORY, [...items, newItem]);
    return newItem;
  },
  
  update: (id: string, updates: Partial<Product>): Product | undefined => {
    const items = getItems<Product>(STORAGE_KEYS.INVENTORY);
    const index = items.findIndex(item => item.id === id);
    
    if (index === -1) return undefined;
    
    const updatedItem = { ...items[index], ...updates };
    const updatedItems = [...items];
    updatedItems[index] = updatedItem;
    
    saveItems(STORAGE_KEYS.INVENTORY, updatedItems);
    return updatedItem;
  },
  
  delete: (id: string): boolean => {
    const items = getItems<Product>(STORAGE_KEYS.INVENTORY);
    const filteredItems = items.filter(item => item.id !== id);
    
    if (filteredItems.length === items.length) return false;
    
    saveItems(STORAGE_KEYS.INVENTORY, filteredItems);
    return true;
  }
};

// Sales operations
export const salesService = {
  getAll: (): Sale[] => getItems<Sale>(STORAGE_KEYS.SALES),
  
  create: (sale: Omit<Sale, 'id' | 'date'>): Sale => {
    const sales = getItems<Sale>(STORAGE_KEYS.SALES);
    const newSale = { 
      ...sale, 
      id: Date.now().toString(),
      date: new Date().toISOString()
    };
    saveItems(STORAGE_KEYS.SALES, [...sales, newSale]);
    return newSale;
  },
  
  getByDateRange: (startDate: Date, endDate: Date): Sale[] => {
    const sales = getItems<Sale>(STORAGE_KEYS.SALES);
    return sales.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= startDate && saleDate <= endDate;
    });
  }
};

// User operations
export const userService = {
  findById: (id: string): User | undefined => {
    const users = getItems<User>(STORAGE_KEYS.USERS);
    return users.find(user => user.id === id);
  },
  
  findByUsername: (username: string): User | undefined => {
    const users = getItems<User>(STORAGE_KEYS.USERS);
    return users.find(user => user.username === username);
  },
  
  validateCredentials: (username: string, password: string): User | undefined => {
    const user = userService.findByUsername(username);
    return user && user.password === password ? user : undefined;
  },
  
  update: (id: string, updates: Partial<User>): User | undefined => {
    const users = getItems<User>(STORAGE_KEYS.USERS);
    const index = users.findIndex(user => user.id === id);
    
    if (index === -1) return undefined;
    
    const updatedUser = { ...users[index], ...updates };
    const updatedUsers = [...users];
    updatedUsers[index] = updatedUser;
    
    saveItems(STORAGE_KEYS.USERS, updatedUsers);
    return updatedUser;
  },
  
  createAdmin: (username: string, password: string, name: string): User | { error: string } => {
    const users = getItems<User>(STORAGE_KEYS.USERS);
    
    // Check if username already exists
    if (users.some(user => user.username === username)) {
      return { error: 'Username already exists' };
    }
    
    // In a real app, you should hash the password here
    const newAdmin: User = {
      id: Date.now().toString(),
      username,
      password, // Note: In production, this should be hashed
      role: 'admin',
      name
    };
    
    saveItems(STORAGE_KEYS.USERS, [...users, newAdmin]);
    return newAdmin;
  }
};

// Types
export type Employee = {
  id: string;
  name: string;
  role: 'admin' | 'employee';
  position?: string;
  department?: string;
  baseSalary?: number;
  paymentMethod?: 'Cash' | 'Check';
};

export type SalaryRecord = {
  id: string;
  employeeId: string;
  employeeName: string;
  position: string;
  period: string;
  baseSalary: number;
  overtimeHours: number;
  overtimeRate: number;
  bonuses: number;
  deductions: number;
  netPay: number;
  status: 'Completed' | 'For Distribution' | 'Distributed' | 'Received';
  paymentMethod: 'Cash' | 'Check';
  paymentDate?: string;
  receivedAt?: string;
  invoiceNumber?: string;
};

// Salary operations
export const salaryService = {
  getAll: (): SalaryRecord[] => getItems<SalaryRecord>(STORAGE_KEYS.SALARIES),
  
  getByEmployee: (employeeId: string): SalaryRecord[] => {
    const salaries = getItems<SalaryRecord>(STORAGE_KEYS.SALARIES);
    return salaries.filter(salary => salary.employeeId === employeeId);
  },
  
  getByPeriod: (period: string): SalaryRecord[] => {
    const salaries = getItems<SalaryRecord>(STORAGE_KEYS.SALARIES);
    return salaries.filter(salary => salary.period === period);
  },
  
  create: (record: Omit<SalaryRecord, 'id'>): SalaryRecord => {
    const records = getItems<SalaryRecord>(STORAGE_KEYS.SALARIES);
    const newRecord = { ...record, id: Date.now().toString() };
    saveItems(STORAGE_KEYS.SALARIES, [...records, newRecord]);
    return newRecord;
  },
  
  update: (id: string, updates: Partial<SalaryRecord>): SalaryRecord | undefined => {
    const records = getItems<SalaryRecord>(STORAGE_KEYS.SALARIES);
    const index = records.findIndex(record => record.id === id);
    
    if (index === -1) return undefined;
    
    const updatedRecord = { ...records[index], ...updates };
    const updatedRecords = [...records];
    updatedRecords[index] = updatedRecord;
    
    saveItems(STORAGE_KEYS.SALARIES, updatedRecords);
    return updatedRecord;
  },
  
  delete: (id: string): boolean => {
    const records = getItems<SalaryRecord>(STORAGE_KEYS.SALARIES);
    const filteredRecords = records.filter(record => record.id !== id);
    
    if (filteredRecords.length === records.length) return false;
    
    saveItems(STORAGE_KEYS.SALARIES, filteredRecords);
    return true;
  },
  
  // Generate salary records for all employees for a given period
  generateSalaries: (period: string, employees: Employee[]): SalaryRecord[] => {
    const existingRecords = salaryService.getByPeriod(period);
    if (existingRecords.length > 0) {
      return existingRecords; // Don't generate duplicates
    }
    
    const newRecords = employees.map(employee => {
      const baseSalary = employee.baseSalary || 0;
      const overtimeHours = Math.floor(Math.random() * 10); // Random 0-10 hours
      const overtimeRate = 1.5 * (baseSalary / (22 * 8)); // 1.5x hourly rate (assuming 22 working days, 8 hours/day)
      const bonuses = Math.random() > 0.7 ? Math.floor(Math.random() * 2000) : 0; // 30% chance of bonus
      const deductions = Math.random() > 0.5 ? Math.floor(Math.random() * 1000) : 0; // 50% chance of deduction
      
      const record: Omit<SalaryRecord, 'id'> = {
        employeeId: employee.id,
        employeeName: employee.name,
        position: employee.position || 'Employee',
        netPay: baseSalary + (overtimeHours * overtimeRate) + bonuses - deductions,
        status: 'For Distribution',
        paymentMethod: employee.paymentMethod || 'Cash',
        paymentDate: undefined,
        receivedAt: undefined,
        period: "",
        baseSalary: 0,
        overtimeHours: 0,
        overtimeRate: 0,
        bonuses: 0,
        deductions: 0
      };
      
      return salaryService.create(record);
    });
    
    return newRecords;
  }
};


export interface EmployeeProduction {
  id: string;
  date: string;
  itemName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalEarnings: number;
  status: 'complete' | 'in-progress' | 'pending';
  remarks?: string;
  submittedAt: string;
  employeeId: string;
  unit: string;
}



export interface Product {
  criticalLevel: number;
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  price: number;
  lastUpdated: string;
  expiryDate?: string; // ISO date string (e.g., '2024-12-31')
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
};

export interface Sale {
  status: string;
  id: string;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  paymentMethod: string;
  date: string;
  customerName: string;
}




export interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'staff' | 'employee';
  name: string;
};
