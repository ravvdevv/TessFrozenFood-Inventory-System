import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { inventoryService, type Product } from "@/services/storage";
import { useEffect, useState } from "react";

const ExpiringItemsReport = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const today = new Date();

  useEffect(() => {
    setProducts(inventoryService.getAll());
  }, []);
  const next30Days = new Date();
  next30Days.setDate(today.getDate() + 30);

  const expiringItems = products.filter((product) => {
    if (!product.expiryDate) return false;
    const expiryDate = new Date(product.expiryDate);
    return expiryDate >= today && expiryDate <= next30Days;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expiring Items Report</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Expiry Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expiringItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{item.expiryDate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpiringItemsReport;
