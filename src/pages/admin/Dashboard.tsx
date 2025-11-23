import { useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, TrendingUp, AlertTriangle, PieChart as PieChartIcon } from 'lucide-react';
import { salesService, inventoryService } from '@/services/storage';
import { PieChart } from '@/components/charts/PieChart';

type MetricCardProps = {
  title: string;
  value: string | number;
  icon: ReactNode;
  description?: string | ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
};

const MetricCard = ({ title, value, icon, trend, description, className = '' }: MetricCardProps) => (
  <Card className={`h-full transition-all hover:shadow-md ${className}`}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
      <div className="h-4 w-4">
        {icon}
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {trend ? (
        <p className={`text-xs mt-1 ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {trend.value}
        </p>
      ) : description ? (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      ) : null}
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const [sales, setSales] = useState<Array<{ date: string; total: number }>>([]);
  const [inventory, setInventory] = useState<Array<{ quantity: number; criticalLevel?: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [salesData, inventoryData] = await Promise.all([
          salesService.getAll(),
          inventoryService.getAll()
        ]);
        
        setSales(salesData);
        setInventory(inventoryData);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'tess_sales' || e.key === 'tess_inventory') {
        fetchData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Calculate metrics
  const metrics = useMemo(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const todaySales = sales.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate.toDateString() === today.toDateString();
    });
    
    const yesterdaySales = sales.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate.toDateString() === yesterday.toDateString();
    });
    
    const totalTodaySales = todaySales.reduce((sum, sale) => sum + sale.total, 0);
    const totalYesterdaySales = yesterdaySales.reduce((sum, sale) => sum + sale.total, 0);
    const salesChange = totalYesterdaySales > 0 
      ? ((totalTodaySales - totalYesterdaySales) / totalYesterdaySales) * 100 
      : 0;
      
    // Calculate weekly sales (last 7 days)
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weeklySales = sales.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= oneWeekAgo;
    });
    const totalWeeklySales = weeklySales.reduce((sum, sale) => sum + sale.total, 0);
    
    // Calculate monthly sales (last 30 days)
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
    const monthlySales = sales.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= oneMonthAgo;
    });
    const totalMonthlySales = monthlySales.reduce((sum, sale) => sum + sale.total, 0);
    
    const criticalItems = inventory.filter(item => 
      item.quantity <= (item.criticalLevel || 5)
    );
    
    // Calculate total stock across all items
    const totalStock = inventory.reduce((sum, item) => sum + item.quantity, 0);
    
    // Calculate price-related metrics
    const totalInventoryValue = inventory.reduce((sum, item) => {
      const price = (item as any).price || 0;
      return sum + (price * item.quantity);
    }, 0);
    
    const avgProductPrice = inventory.length > 0 
      ? totalInventoryValue / inventory.reduce((sum, item) => sum + item.quantity, 0)
      : 0;
    
    const lowStockValue = inventory
      .filter(item => item.quantity < 10)
      .reduce((sum, item) => {
        const price = (item as any).price || 0;
        return sum + (price * item.quantity);
      }, 0);
    
    // Group inventory by category for the pie chart
    const inventoryByCategory = inventory.reduce<Record<string, { count: number; value: number }>>((acc, item) => {
      const category = (item as any).category || 'Uncategorized';
      const price = (item as any).price || 0;
      if (!acc[category]) {
        acc[category] = { count: 0, value: 0 };
      }
      acc[category].count += item.quantity;
      acc[category].value += price * item.quantity;
      return acc;
    }, {});
    
    // Convert to array for the pie chart
    const pieChartData = Object.entries(inventoryByCategory).map(([name, data]) => ({
      name,
      value: data.count,
      totalValue: data.value
    }));
    
    return {
      totalSales: sales.reduce((sum, sale) => sum + sale.total, 0),
      weeklySales: totalWeeklySales,
      monthlySales: totalMonthlySales,
      totalProducts: inventory.length,
      totalStock,
      totalInventoryValue,
      avgProductPrice,
      lowStockValue,
      lowStockItems: inventory.filter(item => item.quantity < 10).length,
      criticalItems: criticalItems.length,
      todaySales: totalTodaySales,
      salesChange,
      pieChartData
    };
  }, [sales, inventory]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 text-destructive p-4 rounded-md">
        {error}
      </div>
    );
  }
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground">
          Monitor your inventory and production performance at a glance
        </p>
      </div>


      {/* Inventory Overview Section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Package className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Inventory Overview</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Value"
            value={new Intl.NumberFormat('en-PH', {
              style: 'currency',
              currency: 'PHP',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(metrics.totalInventoryValue)}
            description={`${metrics.totalProducts} products`}
            icon={<Package className="h-4 w-4 text-indigo-500" />}
            className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-background"
          />
          <MetricCard
            title="Average Price"
            value={new Intl.NumberFormat('en-PH', {
              style: 'currency',
              currency: 'PHP',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            }).format(metrics.avgProductPrice)}
            description="Per item"
            icon={<TrendingUp className="h-4 w-4 text-purple-500" />}
            className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-background"
          />
          <MetricCard
            title="Low Stock"
            value={metrics.lowStockItems}
            description={`${new Intl.NumberFormat('en-PH', {
              style: 'currency',
              currency: 'PHP',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(metrics.lowStockValue)} at risk`}
            icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
            className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/20 dark:to-background"
          />
          <MetricCard
            title="Critical Items"
            value={metrics.criticalItems}
            description={metrics.criticalItems > 0 ? 'Needs immediate attention' : 'All good'}
            icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
            className={`bg-gradient-to-br ${metrics.criticalItems > 0 ? 'from-red-50 to-white dark:from-red-900/20' : 'from-green-50 to-white dark:from-green-900/20'} dark:to-background`}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">         
        <Card className="col-span-4 p-6">
          <CardHeader className="p-0 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <PieChartIcon className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg font-semibold">Inventory Distribution</CardTitle>
              </div>
              <div className="text-sm text-muted-foreground">
                {metrics.pieChartData?.length || 0} categories
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 mt-2">
            {metrics.pieChartData?.length > 0 ? (
              <PieChart 
                data={metrics.pieChartData} 
                title=""
                height={280}
                innerRadius="55%"
                outerRadius="85%"
              />
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground border rounded-lg">
                No inventory data available
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Inventory Summary</CardTitle>
            <p className="text-sm text-muted-foreground">Current stock status overview</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Total Stock Value</span>
                <span className="font-medium">
                  {new Intl.NumberFormat('en-PH', {
                    style: 'currency',
                    currency: 'PHP',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(metrics.totalInventoryValue || 0)}
                </span>
              </div>
              <div className="h-2 bg-muted-foreground/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full" 
                  style={{ width: `${Math.min(100, (metrics.totalInventoryValue / Math.max(metrics.totalInventoryValue * 1.5, 10000)) * 100)}%` }}
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Total Products</span>
                </div>
                <span className="font-medium">{metrics.totalProducts}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Weekly Inventory Value</span>
                </div>
                <span className={`font-medium ${(metrics.totalInventoryValue - metrics.weeklySales) < 0 ? 'text-red-500' : 'text-green-500'}`}>
                  ₱{(metrics.totalInventoryValue - metrics.weeklySales).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Monthly Inventory Value</span>
                </div>
                <span className={`font-medium ${(metrics.totalInventoryValue - metrics.monthlySales) < 0 ? 'text-red-500' : 'text-green-500'}`}>
                  ₱{(metrics.totalInventoryValue - metrics.monthlySales).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">Low Stock Items</span>
                </div>
                <span className="font-medium">{metrics.lowStockItems}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">Critical Items</span>
                </div>
                <div className={`font-medium ${metrics.criticalItems > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {metrics.criticalItems > 0 ? `${metrics.criticalItems} to restock` : 'All good'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
