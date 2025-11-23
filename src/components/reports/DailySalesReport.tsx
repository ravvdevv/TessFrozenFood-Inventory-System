import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { salesService, type Sale } from "@/services/storage";

import { useEffect, useState } from "react";

const DailySalesReport = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    setSales(salesService.getAll());
  }, []);
  const dailySales = sales.filter((sale) => sale.date.startsWith(today));

  const totalSales = dailySales.reduce((total, sale) => total + sale.total, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Sales Report</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between">
            <span>Total Sales</span>
            <span>{totalSales}</span>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dailySales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>{sale.id}</TableCell>
                    <TableCell>{sale.customerName}</TableCell>
                    <TableCell>{sale.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DailySalesReport;
