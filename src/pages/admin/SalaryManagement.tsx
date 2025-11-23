import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, CheckCircle, Clock, AlertCircle, DollarSign, Eye, Trash2, Edit, FileText, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';

// Types
type ProductionRecord = {
  id: string;
  employeeId: string;
  employeeName: string;
  itemName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalEarnings: number;
  date: string;
  status: 'pending' | 'reviewed' | 'paid';
};

type Employee = {
  id: string;
  name: string;
  position: string;
  baseSalary: number;
  paymentMethod: 'Cash' | 'OnlinePayment';
  productionRate: number;
};

type SalaryRecord = {
  id: string;
  employeeId: string;
  employeeName: string;
  period: string;
  baseSalary: number;
  productionEarnings: number;
  bonuses: number;
  deductions: number;
  netPay: number;
  status: 'Pending' | 'Processing' | 'Paid';
  paymentMethod: 'Cash' | 'OnlinePayment';
  paymentDate?: string;
  paymentNotes?: string;
  productionRecords: ProductionRecord[];
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEYS = {
  SALARY_RECORDS: 'tess_salary_records',
  EMPLOYEES: 'tess_employees',
  PRODUCTION_RECORDS: 'tess_production_records',
  USERS: 'tess_users'
} as const;

export default function SalaryManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [salaries, setSalaries] = useState<SalaryRecord[]>([]);
  const [productionRecords, setProductionRecords] = useState<ProductionRecord[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('current');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Dialog states
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState<SalaryRecord | null>(null);
  
  // Form states
  const [paymentNotes, setPaymentNotes] = useState('');
  const [editBonuses, setEditBonuses] = useState(0);
  const [editDeductions, setEditDeductions] = useState(0);
  const [editPaymentMethod, setEditPaymentMethod] = useState<'Cash' | 'OnlinePayment'>('Cash');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch employees and production data
  useEffect(() => {
    if (selectedSalary) {
      setEditBonuses(selectedSalary.bonuses);
      setEditDeductions(selectedSalary.deductions);
      setEditPaymentMethod(selectedSalary.paymentMethod);
    }
    const fetchData = async () => {
      try {
        let employeeList: Employee[] = [];
        
        // Try to get employees from localStorage
        const storedEmployees = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
        if (storedEmployees) {
          employeeList = JSON.parse(storedEmployees);
        } else {
          // If no employees found, check for users in auth context
          const authUsers = localStorage.getItem(STORAGE_KEYS.USERS);
          if (authUsers) {
            const users = JSON.parse(authUsers);
            // Ensure paymentMethod is set to a valid value
            employeeList = users.map((user: any) => ({
              ...user,
              paymentMethod: 'Cash' // Default to Cash for existing users
            }))
              .filter((user: any) => user.role === 'employee')
              .map((user: any) => ({
                id: user.id,
                name: user.name || user.username,
                position: 'Production Staff',
                baseSalary: 0,
                paymentMethod: 'Cash',
                productionRate: 15
              }));
            
            if (employeeList.length > 0) {
              localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employeeList));
            }
          }
        }
        setEmployees(employeeList);

        // Get production records
        const storedProduction = localStorage.getItem(STORAGE_KEYS.PRODUCTION_RECORDS);
        if (storedProduction) {
          const records = JSON.parse(storedProduction);
          setProductionRecords(records);
        }

        // Get existing salary records
        const storedSalaries = localStorage.getItem(STORAGE_KEYS.SALARY_RECORDS);
        if (storedSalaries) {
          setSalaries(JSON.parse(storedSalaries));
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    fetchData();
    
    // Add empty dependency array to run only once on mount
  }, []);

  // Helper functions
  const getPeriodLabel = (period: string): string => {
    const now = new Date();
    
    switch (period) {
      case 'current':
        return format(now, 'MMMM yyyy');
      case 'previous': {
        const lastMonth = new Date(now);
        lastMonth.setMonth(now.getMonth() - 1);
        return format(lastMonth, 'MMMM yyyy');
      }
      default:
        return 'All Time';
    }
  };

  const isInPeriod = (dateString: string, period: string): boolean => {
    if (period === 'all') return true;
    
    const date = new Date(dateString);
    const now = new Date();
    
    if (period === 'current') {
      return date.getMonth() === now.getMonth() && 
             date.getFullYear() === now.getFullYear();
    }
    
    if (period === 'last') {
      const lastMonth = new Date(now);
      lastMonth.setMonth(now.getMonth() - 1);
      return date.getMonth() === lastMonth.getMonth() && 
             date.getFullYear() === lastMonth.getFullYear();
    }
    
    return false;
  };
  // Calculate salary based on production
  const calculateSalary = (employee: Employee, period: string): SalaryRecord | null => {
    const periodProduction = productionRecords.filter(record => 
      record.employeeId === employee.id && 
      isInPeriod(record.date, period)
    );

    // Find all production that hasn't been paid yet.
    const unpaidProduction = periodProduction.filter(r => r.status !== 'paid');

    if (unpaidProduction.length === 0) {
      return null; // No unpaid work, nothing to do.
    }

    const existingSalariesForPeriod = salaries.filter(s => 
      s.employeeId === employee.id && 
      s.period.startsWith(getPeriodLabel(period))
    );

    // From all unpaid production, find records that are not yet listed in ANY salary record for the period.
    const newProduction = unpaidProduction.filter(p => 
      !existingSalariesForPeriod.some(s => 
        s.productionRecords.some(pr => pr.id === p.id)
      )
    );

    if (newProduction.length === 0) {
      return null; // All unpaid work is already accounted for in a pending/processing record.
    }

    const newEarnings = newProduction.reduce((total, r) => total + r.totalEarnings, 0);
    const isFirstRecordForPeriod = existingSalariesForPeriod.length === 0;

    // If it's the first record for the period, create a main record.
    // Otherwise, create an "Adjustment" record.
    return {
      id: `salary-${employee.id}-${Date.now()}`, // Always a new record for new work
      employeeId: employee.id,
      employeeName: employee.name,
      period: isFirstRecordForPeriod ? getPeriodLabel(period) : `${getPeriodLabel(period)} (Adjustment)`,
      baseSalary: isFirstRecordForPeriod ? employee.baseSalary : 0,
      productionEarnings: newEarnings,
      bonuses: 0, // Bonuses/deductions would be manual edits
      deductions: 0,
      netPay: (isFirstRecordForPeriod ? employee.baseSalary : 0) + newEarnings,
      status: 'Pending',
      paymentMethod: employee.paymentMethod,
      paymentDate: undefined,
      paymentNotes: undefined,
      productionRecords: newProduction,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  };

  // CRUD Operations
  const handleGenerateSalaries = () => {
    const newOrUpdatedSalaries = employees
      .map(employee => calculateSalary(employee, selectedPeriod))
      .filter((salary): salary is SalaryRecord => salary !== null);

    if (newOrUpdatedSalaries.length === 0) {
      showSuccess('No new production records to generate salaries for.');
      return;
    }

    const updatedSalaries = [...salaries];
    newOrUpdatedSalaries.forEach(newSalary => {
      const existingIndex = updatedSalaries.findIndex(
        s => s.id === newSalary.id
      );
      if (existingIndex >= 0) {
        updatedSalaries[existingIndex] = newSalary;
      } else {
        updatedSalaries.push(newSalary);
      }
    });
    
    localStorage.setItem(STORAGE_KEYS.SALARY_RECORDS, JSON.stringify(updatedSalaries));
    setSalaries(updatedSalaries);
    showSuccess(`${newOrUpdatedSalaries.length} salary record(s) generated/updated successfully!`);
  };

  const handleUpdateSalary = () => {
    if (!selectedSalary) return;
    
    const updatedSalary = {
      ...selectedSalary,
      bonuses: editBonuses,
      deductions: editDeductions,
      paymentMethod: editPaymentMethod,
      netPay: selectedSalary.baseSalary + selectedSalary.productionEarnings + editBonuses - editDeductions,
      updatedAt: new Date().toISOString()
    };
    
    // Update the salaries array with the updated salary
    const updatedSalaries = salaries.map(salary => 
      salary.id === updatedSalary.id ? updatedSalary : salary
    );
    
    // Save to localStorage and update state
    localStorage.setItem(STORAGE_KEYS.SALARY_RECORDS, JSON.stringify(updatedSalaries));
    setSalaries(updatedSalaries);
    setSelectedSalary(updatedSalary);
    setShowEditDialog(false);
    showSuccess('Salary updated successfully!');
  };
  
  const handleProcessPayment = (status: 'Processing' | 'Paid') => {
    if (!selectedSalary) return;

    // Create a new salary object with updated values
    const updatedSalary: SalaryRecord = {
      ...selectedSalary,
      status,
      paymentMethod: editPaymentMethod, // Use the current editPaymentMethod state
      paymentDate: status === 'Paid' ? new Date().toISOString() : selectedSalary.paymentDate,
      paymentNotes: status === 'Paid' ? paymentNotes : selectedSalary.paymentNotes,
      updatedAt: new Date().toISOString()
    };
    
    // Update the selected salary to reflect changes immediately
    setSelectedSalary(updatedSalary);

    const updatedSalaries = salaries.map(s => 
      s.id === selectedSalary.id ? updatedSalary : s
    );
    
    localStorage.setItem(STORAGE_KEYS.SALARY_RECORDS, JSON.stringify(updatedSalaries));
    setSalaries(updatedSalaries);
    
    if (status === 'Paid') {
      // Update production records status
      const updatedProduction = productionRecords.map(record => {
        if (selectedSalary.productionRecords.some(pr => pr.id === record.id)) {
          return { ...record, status: 'paid' as const };
        }
        return record;
      });
      localStorage.setItem(STORAGE_KEYS.PRODUCTION_RECORDS, JSON.stringify(updatedProduction));
      setProductionRecords(updatedProduction);
    }
    
    setShowPaymentDialog(false);
    setSelectedSalary(null);
    setPaymentNotes('');
    showSuccess(`Payment ${status === 'Paid' ? 'completed' : 'processing'} successfully!`);
  };

  const handleDeleteSalary = () => {
    if (!selectedSalary) return;

    const updatedSalaries = salaries.filter(s => s.id !== selectedSalary.id);
    localStorage.setItem(STORAGE_KEYS.SALARY_RECORDS, JSON.stringify(updatedSalaries));
    setSalaries(updatedSalaries);
    setShowDeleteDialog(false);
    setSelectedSalary(null);
    showSuccess('Salary record deleted successfully!');
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Open dialogs
  const openDetailsDialog = (salary: SalaryRecord) => {
    setSelectedSalary(salary);
    setShowDetailsDialog(true);
  };

  const openEditDialog = (salary: SalaryRecord) => {
    setSelectedSalary(salary);
    setEditBonuses(salary.bonuses);
    setEditDeductions(salary.deductions);
    setEditPaymentMethod(salary.paymentMethod || 'Cash');
    setShowEditDialog(true);
  };

  const openPaymentDialog = (salary: SalaryRecord) => {
    setSelectedSalary(salary);
    // Make sure we have a valid payment method, default to 'Cash' if not set
    setEditPaymentMethod(salary.paymentMethod || 'Cash');
    setPaymentNotes(salary.paymentNotes || '');
    setShowPaymentDialog(true);
  };

  const openDeleteDialog = (salary: SalaryRecord) => {
    setSelectedSalary(salary);
    setShowDeleteDialog(true);
  };

  // Filter and search
  const filteredSalaries = salaries
    .filter(salary => {
      const matchesSearch = salary.employeeName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || salary.status === statusFilter;
      const matchesPeriod = selectedPeriod === 'all' || salary.period.startsWith(getPeriodLabel(selectedPeriod));
      return matchesSearch && matchesStatus && matchesPeriod;
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  // Calculate totals
  const totals = filteredSalaries.reduce((acc, salary) => ({
    baseSalary: acc.baseSalary + salary.baseSalary,
    productionEarnings: acc.productionEarnings + salary.productionEarnings,
    bonuses: acc.bonuses + salary.bonuses,
    deductions: acc.deductions + salary.deductions,
    netPay: acc.netPay + salary.netPay
  }), { baseSalary: 0, productionEarnings: 0, bonuses: 0, deductions: 0, netPay: 0 });

  return (
    <div className="space-y-6 p-6">
      {successMessage && (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Salary Management</h2>
          <p className="text-muted-foreground">
            Manage employee salaries based on production records
          </p>
        </div>
        <Button onClick={handleGenerateSalaries} size="lg">
          <DollarSign className="mr-2 h-4 w-4" />
          Generate Salaries
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Base Salary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱{totals.baseSalary.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Production Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₱{totals.productionEarnings.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Bonuses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">₱{totals.bonuses.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Net Pay</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱{totals.netPay.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current">Current Month</SelectItem>
            <SelectItem value="last">Last Month</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Processing">Processing</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Salary Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Salary Records</CardTitle>
          <CardDescription>View and manage employee salary records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
          <Table>
  <TableHeader>
    <TableRow className="bg-gray-50">
      <TableHead className="font-semibold">Employee</TableHead>
      <TableHead className="font-semibold">Period</TableHead>
      <TableHead className="text-right font-semibold">Base Salary</TableHead>
      <TableHead className="text-right font-semibold">Production</TableHead>
      <TableHead className="text-right font-semibold">Bonuses</TableHead>
      <TableHead className="text-right font-semibold">Deductions</TableHead>
      <TableHead className="text-right font-semibold bg-gray-100">Net Pay</TableHead>
      <TableHead className="font-semibold">Status</TableHead>
      <TableHead className="font-semibold">Payment Method</TableHead>
      <TableHead className="text-center font-semibold">Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {filteredSalaries.length > 0 ? (
      filteredSalaries.map((salary) => (
        <TableRow key={salary.id} className="hover:bg-gray-50">
          <TableCell className="font-medium">{salary.employeeName}</TableCell>
          <TableCell className="text-gray-600">{salary.period}</TableCell>
          <TableCell className="text-right font-medium">₱{salary.baseSalary.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
          <TableCell className="text-right font-medium text-green-700">
            +₱{salary.productionEarnings.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </TableCell>
          <TableCell className="text-right font-medium text-blue-700">
            +₱{salary.bonuses.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </TableCell>
          <TableCell className="text-right font-medium text-red-700">
            -₱{salary.deductions.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </TableCell>
          <TableCell className="text-right font-bold bg-gray-50">
            ₱{salary.netPay.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </TableCell>
          <TableCell>
            <Badge 
              variant={
                salary.status === 'Paid' ? 'default' : 
                salary.status === 'Processing' ? 'secondary' : 'outline'
              }
              className="gap-1"
            >
              {salary.status === 'Paid' && <CheckCircle className="h-3 w-3" />}
              {salary.status === 'Processing' && <Clock className="h-3 w-3" />}
              {salary.status === 'Pending' && <AlertCircle className="h-3 w-3" />}
              {salary.status}
            </Badge>
          </TableCell>
          <TableCell className="text-center font-bold">{salary.paymentMethod}</TableCell>
          <TableCell>
            <div className="flex items-center justify-center gap-1">
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => openDetailsDialog(salary)}
                className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                title="View Details"
              >
                <Eye className="h-4 w-4" />
                <span className="sr-only">View Details</span>
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => openEditDialog(salary)}
                disabled={salary.status === 'Paid'}
                className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-40"
                title="Edit"
              >
                <Edit className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Button>
              {salary.status === 'Pending' && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => openPaymentDialog(salary)}
                  className="h-8 px-3 text-xs"
                >
                  Process
                </Button>
              )}
              {salary.status === 'Processing' && (
                <Button 
                  size="sm" 
                  variant="default"
                  onClick={() => openPaymentDialog(salary)}
                  className="h-8 px-3 text-xs"
                >
                  Pay Now
                </Button>
              )}
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => openDeleteDialog(salary)}
                className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete</span>
              </Button>
            </div>
          </TableCell>
        </TableRow>
      ))
    ) : (
      <TableRow>
        <TableCell colSpan={10} className="text-center py-12">
          {salaries.length === 0 ? (
            <div className="flex flex-col items-center gap-3">
              <FileText className="h-12 w-12 text-gray-400" />
              <div>
                <p className="text-gray-600 font-medium">No salary records found</p>
                <p className="text-sm text-gray-500 mt-1">Click "Generate Salaries" to create records</p>
              </div>
            </div>
          ) : (
            <div className="text-gray-600">
              No records match your filters
            </div>
          )}
        </TableCell>
      </TableRow>
    )}
  </TableBody>
</Table>
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Salary Details</DialogTitle>
            <DialogDescription>
              Detailed breakdown for {selectedSalary?.employeeName}
            </DialogDescription>
          </DialogHeader>
          {selectedSalary && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Employee</Label>
                  <p className="font-medium">{selectedSalary.employeeName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Period</Label>
                  <p className="font-medium">{selectedSalary.period}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Payment Method</Label>
                  <p className="font-medium">{selectedSalary.paymentMethod}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge variant={selectedSalary.status === 'Paid' ? 'default' : 'outline'}>
                    {selectedSalary.status}
                  </Badge>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Salary Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Base Salary</span>
                    <span className="font-medium">₱{selectedSalary.baseSalary.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Production Earnings</span>
                    <span className="font-medium">₱{selectedSalary.productionEarnings.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-blue-600">
                    <span>Bonuses</span>
                    <span className="font-medium">₱{selectedSalary.bonuses.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Deductions</span>
                    <span className="font-medium">-₱{selectedSalary.deductions.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 text-lg font-bold">
                    <span>Net Pay</span>
                    <span>₱{selectedSalary.netPay.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Production Records ({selectedSalary.productionRecords.length})</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedSalary.productionRecords.map((record) => (
                    <div key={record.id} className="flex justify-between text-sm border-b pb-2">
                      <div>
                        <p className="font-medium">{record.itemName}</p>
                        <p className="text-muted-foreground">
                          {record.quantity} {record.unit} × ₱{(record.unitPrice || 0).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₱{(record.totalEarnings || 0).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(record.date), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedSalary.paymentDate && (
                <div className="border-t pt-4">
                  <Label className="text-muted-foreground">Payment Date</Label>
                  <p>{format(new Date(selectedSalary.paymentDate), 'PPP')}</p>
                </div>
              )}

              {selectedSalary.paymentNotes && (
                <div>
                  <Label className="text-muted-foreground">Payment Notes</Label>
                  <p className="text-sm">{selectedSalary.paymentNotes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Salary</DialogTitle>
            <DialogDescription>
              Update bonuses and deductions for {selectedSalary?.employeeName}
            </DialogDescription>
          </DialogHeader>
          {selectedSalary && (
            <div className="space-y-4">
              <div>
                <Label>Base Salary (Fixed)</Label>
                <Input value={`₱${selectedSalary.baseSalary.toFixed(2)}`} disabled />
              </div>
              <div>
                <Label>Production Earnings (Fixed)</Label>
                <Input value={`₱${selectedSalary.productionEarnings.toFixed(2)}`} disabled />
              </div>
              <div>
                <Label htmlFor="bonuses">Bonuses (₱)</Label>
                <Input
                  id="bonuses"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editBonuses}
                  onChange={(e) => setEditBonuses(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="deductions">Deductions (₱)</Label>
                <Input
                  id="deductions"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editDeductions}
                  onChange={(e) => setEditDeductions(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <div className="relative">
                  <select
                    id="paymentMethod"
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={editPaymentMethod}
                    onChange={(e) => setEditPaymentMethod(e.target.value as 'Cash' | 'OnlinePayment')}
                  >
                    <option value="Cash" className="py-2">💵 Cash</option>
                    <option value="OnlinePayment" className="py-2">💳 Online Payment</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>New Net Pay</span>
                  <span>
                    ₱{(selectedSalary.baseSalary + selectedSalary.productionEarnings + editBonuses - editDeductions).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSalary}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedSalary?.status === 'Pending' ? 'Process Payment' : 'Complete Payment'}
            </DialogTitle>
            <DialogDescription>
              {selectedSalary?.status === 'Pending' 
                ? 'Mark this salary as processing' 
                : 'Mark this salary as paid'}
            </DialogDescription>
          </DialogHeader>
          {selectedSalary && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Employee</span>
                  <span className="font-medium">{selectedSalary.employeeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Period</span>
                  <span className="font-medium">{selectedSalary.period}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Payment Method</span>
                  <div className="flex items-center gap-2 font-medium">
                    {editPaymentMethod === 'Cash' ? (
                      <span>💵 Cash</span>
                    ) : (
                      <span>💳 Online Payment</span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                  <span>Amount to Pay</span>
                  <span>₱{selectedSalary.netPay.toFixed(2)}</span>
                </div>
              </div>

              {selectedSalary.status === 'Processing' && (
                <div>
                  <Label htmlFor="paymentNotes">Payment Notes</Label>
                  <Textarea
                    id="paymentNotes"
                    placeholder="Enter payment details, reference number, etc..."
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              )}

              {selectedSalary.status === 'Processing' && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This action will mark all related production records as paid and cannot be undone.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancel
            </Button>
            {selectedSalary?.status === 'Pending' && (
              <Button onClick={() => handleProcessPayment('Processing')}>
                <Clock className="mr-2 h-4 w-4" />
                Mark as Processing
              </Button>
            )}
            {selectedSalary?.status === 'Processing' && (
              <Button onClick={() => handleProcessPayment('Paid')}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark as Paid
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Salary Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this salary record?
            </DialogDescription>
          </DialogHeader>
          {selectedSalary && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This action cannot be undone. This will permanently delete the salary record for{' '}
                  <strong>{selectedSalary.employeeName}</strong> for the period of{' '}
                  <strong>{selectedSalary.period}</strong>.
                </AlertDescription>
              </Alert>

              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Employee</span>
                  <span className="font-medium">{selectedSalary.employeeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Period</span>
                  <span className="font-medium">{selectedSalary.period}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Net Pay</span>
                  <span className="font-medium">₱{selectedSalary.netPay.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={selectedSalary.status === 'Paid' ? 'default' : 'outline'}>
                    {selectedSalary.status}
                  </Badge>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSalary}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}