import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { salesService } from "@/services/storage";
import { useEffect, useState } from "react";

interface Sale {
  id: string;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  date: string;
  customerName: string;
  paymentMethod: string;
}

const MonthlySalesReport = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const currentMonth = new Date().getMonth();

  useEffect(() => {
    setSales(salesService.getAll());
  }, []);
  const monthlySales = sales.filter((sale) => new Date(sale.date).getMonth() === currentMonth);

  const totalSales = monthlySales.reduce((total, sale) => total + sale.total, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Sales Report</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between">
            <span>Total Sales</span>
            <span>{totalSales}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlySalesReport;
