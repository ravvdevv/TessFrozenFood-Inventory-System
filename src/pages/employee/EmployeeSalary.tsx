import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, FileText, Wallet, TrendingUp, PiggyBank, Hourglass } from 'lucide-react';

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
  paymentMethod: 'Cash' | 'Check' | 'Bank Transfer';
  paymentDate?: string;
  paymentNotes?: string;
  productionRecords: ProductionRecord[];
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEYS = {
  SALARY_RECORDS: 'tess_salary_records',
  PRODUCTION_RECORDS: 'tess_production_records',
} as const;

export default function EmployeeSalary() {
  const { user } = useAuth();
  const [mySalaries, setMySalaries] = useState<SalaryRecord[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('current');
  
  // Dialog states
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState<SalaryRecord | null>(null);

  // New states for earning potential
  const [pendingEarnings, setPendingEarnings] = useState(0);

  // Fetch data
  useEffect(() => {
    if (!user) return;

    const fetchData = () => {
      try {
        // Get salary records
        const storedSalaries = localStorage.getItem(STORAGE_KEYS.SALARY_RECORDS);
        if (storedSalaries) {
          const allSalaries: SalaryRecord[] = JSON.parse(storedSalaries);
          const userSalaries = allSalaries.filter(s => s.employeeId === user.id);
          setMySalaries(userSalaries);
        }

        // Calculate pending earnings from production records
        const storedProduction = localStorage.getItem(STORAGE_KEYS.PRODUCTION_RECORDS);
        if (storedProduction) {
          const allProduction: ProductionRecord[] = JSON.parse(storedProduction);
          const userUnpaidProduction = allProduction
            .filter(p => p.employeeId === user.id && p.status !== 'paid')
            .reduce((total, record) => total + record.totalEarnings, 0);
          setPendingEarnings(userUnpaidProduction);
        }

      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    fetchData();
  }, [user]);

  // Helper function
  const getPeriodLabel = (period: string): string => {
    const now = new Date();
    switch (period) {
      case 'current':
        return format(now, 'MMMM yyyy');
      case 'last':
        const lastMonth = new Date(now);
        lastMonth.setMonth(now.getMonth() - 1);
        return format(lastMonth, 'MMMM yyyy');
      default:
        return 'All Time';
    }
  };

  // Open details dialog
  const openDetailsDialog = (salary: SalaryRecord) => {
    setSelectedSalary(salary);
    setShowDetailsDialog(true);
  };

  // Filter salaries
  const filteredSalaries = mySalaries
    .filter(salary => {
      const matchesPeriod = selectedPeriod === 'all' || salary.period.startsWith(getPeriodLabel(selectedPeriod));
      return matchesPeriod;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Calculate totals for the logged-in employee
  const totals = filteredSalaries.reduce((acc, salary) => ({
    productionEarnings: acc.productionEarnings + salary.productionEarnings,
    bonuses: acc.bonuses + salary.bonuses,
    netPay: acc.netPay + salary.netPay
  }), { productionEarnings: 0, bonuses: 0, netPay: 0 });

  const latestSalary = filteredSalaries[0];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">My Salary</h2>
          <p className="text-muted-foreground">
            Welcome, {user?.name}! Here's your salary and production overview.
          </p>
        </div>
      </div>

      {/* Earning Potential Section */}
      <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-background">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">Pending Earnings</CardTitle>
          <Hourglass className="h-5 w-5 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-700">₱{pendingEarnings.toFixed(2)}</div>
          <p className="text-sm text-muted-foreground">Earnings from production not yet included in a salary.</p>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Latest Net Pay</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱{latestSalary?.netPay.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">{latestSalary?.period || 'No data yet'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Production Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₱{totals.productionEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Across all filtered periods</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Bonuses</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">₱{totals.bonuses.toFixed(2)}</div>
             <p className="text-xs text-muted-foreground">Across all filtered periods</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex justify-end gap-4">
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
      </div>

      {/* Salary Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>My Salary History</CardTitle>
          <CardDescription>Your record of payments and earnings.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Base Salary</TableHead>
                  <TableHead className="text-right">Production</TableHead>
                  <TableHead className="text-right">Bonuses</TableHead>
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right font-bold">Net Pay</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSalaries.length > 0 ? (
                  filteredSalaries.map((salary) => (
                    <TableRow key={salary.id}>
                      <TableCell>{salary.period}</TableCell>
                      <TableCell className="text-right">₱{salary.baseSalary.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-green-600">
                        ₱{salary.productionEarnings.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-blue-600">
                        ₱{salary.bonuses.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        -₱{salary.deductions.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        ₱{salary.netPay.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={salary.status === 'Paid' ? 'default' : 'outline'}>
                          {salary.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm" 
                          onClick={() => openDetailsDialog(salary)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-12 w-12 text-muted-foreground" />
                        <p className="text-muted-foreground">No salary records found for you yet.</p>
                        <p className="text-sm text-muted-foreground">Your salary data will appear here once generated by an admin.</p>
                      </div>
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
              Detailed breakdown for {selectedSalary?.period}
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
                <h4 className="font-semibold mb-3">Salary Calculation</h4>
                <div className="space-y-2 text-sm bg-muted/50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Base Salary</span>
                    <span className="font-mono font-medium">₱{selectedSalary.baseSalary.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">(+) Production Earnings</span>
                    <span className="font-mono font-medium text-green-600">+ ₱{selectedSalary.productionEarnings.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">(+) Bonuses</span>
                    <span className="font-mono font-medium text-blue-600">+ ₱{selectedSalary.bonuses.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">(-) Deductions</span>
                    <span className="font-mono font-medium text-red-600">- ₱{selectedSalary.deductions.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-dashed border-foreground/20 pt-2 mt-2">
                    <span className="text-lg font-bold">Net Pay</span>
                    <span className="font-mono text-lg font-bold">= ₱{selectedSalary.netPay.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Production Records ({selectedSalary.productionRecords.length})</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedSalary.productionRecords.length > 0 ? (
                    selectedSalary.productionRecords.map((record) => (
                      <div key={record.id} className="flex justify-between text-sm border-b pb-2">
                        <div>
                          <p className="font-medium">{record.itemName}</p>
                          <p className="text-muted-foreground">
                            {record.quantity} {record.unit} × ₱{record.unitPrice.toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">₱{record.totalEarnings.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(record.date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                     <p className="text-sm text-muted-foreground text-center">No production records for this period.</p>
                  )}
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
    </div>
  );
}
