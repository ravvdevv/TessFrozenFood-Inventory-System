import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router-dom';
import { Wallet, Box, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';

// Mock data types - assuming these are defined elsewhere
type SalaryRecord = {
  id: string;
  employeeId: string;
  netPay: number;
  period: string;
  createdAt: string;
};

type ProductionRecord = {
  id: string;
  employeeId: string;
  quantity: number;
  date: string;
};

const STORAGE_KEYS = {
  SALARY_RECORDS: 'tess_salary_records',
  PRODUCTION_RECORDS: 'tess_production_records',
} as const;

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [latestSalary, setLatestSalary] = useState<SalaryRecord | null>(null);
  const [monthlyProduction, setMonthlyProduction] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Fetch latest salary
    const storedSalaries = localStorage.getItem(STORAGE_KEYS.SALARY_RECORDS);
    if (storedSalaries) {
      const allSalaries: SalaryRecord[] = JSON.parse(storedSalaries)
        .filter((s: SalaryRecord) => s.employeeId === user.id)
        .sort((a: SalaryRecord, b: SalaryRecord) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      if (allSalaries.length > 0) {
        setLatestSalary(allSalaries[0]);
      }
    }

    // Fetch this month's production
    const storedProduction = localStorage.getItem(STORAGE_KEYS.PRODUCTION_RECORDS);
    if (storedProduction) {
      const allProduction: ProductionRecord[] = JSON.parse(storedProduction);
      const now = new Date();
      const userProduction = allProduction
        .filter(p => {
          const recordDate = new Date(p.date);
          return p.employeeId === user.id &&
                 recordDate.getMonth() === now.getMonth() &&
                 recordDate.getFullYear() === now.getFullYear();
        })
        .reduce((total, record) => total + record.quantity, 0);
      setMonthlyProduction(userProduction);
    }
  }, [user]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold">Welcome, {user?.name}!</h2>
        <p className="text-muted-foreground">Here is a quick summary of your activity.</p>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Latest Net Pay</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱{latestSalary?.netPay.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">{latestSalary?.period || 'No salary generated yet'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Production This Month</CardTitle>
            <Box className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlyProduction} items</div>
            <p className="text-xs text-muted-foreground">Total items you have produced.</p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Cards */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/employee/salary">
            <Card className="hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>My Salary</CardTitle>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">View your detailed salary history and payment status.</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/employee/production">
            <Card className="hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>My Production</CardTitle>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">See all your production records and performance.</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/employee/inventory">
            <Card className="hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>View Inventory</CardTitle>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Check current stock levels of products.</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
