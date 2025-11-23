import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { inventoryService, type Product } from "@/services/storage";
import { useEffect, useState } from "react";

const InventoryStatusReport = () => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    setProducts(inventoryService.getAll());
  }, []);

  const totalProducts = products.length;
  const totalQuantity = products.reduce((total, product) => total + product.quantity, 0);
  const lowStockItems = products.filter((product) => product.quantity <= (product.criticalLevel || 0)).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory Status Report</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between">
          <span>Total Products</span>
          <span>{totalProducts}</span>
        </div>
        <div className="flex justify-between">
          <span>Total Quantity</span>
          <span>{totalQuantity}</span>
        </div>
        <div className="flex justify-between">
          <span>Low Stock Items</span>
          <span>{lowStockItems}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default InventoryStatusReport;
