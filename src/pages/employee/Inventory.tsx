import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Clock, AlertTriangle } from 'lucide-react';
import { inventoryService } from '@/services/storage';
import type { Product } from '@/services/storage';

// Extend the Product type to include unit and expiry status
type InventoryItem = Product & {
  unit: string;
  isExpired: boolean;
  isExpiringSoon: boolean;
  daysUntilExpiry?: number;
};

export function EmployeeInventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExpired, setShowExpired] = useState(false);

  // Helper function to determine unit based on product name or category
  const determineUnit = (productName: string): string => {
    const lowerName = productName.toLowerCase();
    if (lowerName.includes('kg') || lowerName.includes('kilo')) return 'kg';
    if (lowerName.includes('g') || lowerName.includes('gram')) return 'g';
    if (lowerName.includes('l') || lowerName.includes('liter')) return 'L';
    return 'pcs'; // Default unit
  };

  // Helper function to get status badge class based on quantity
  const getStatusBadgeClass = (quantity: number) => {
    if (quantity === 0) return 'bg-red-100 text-red-800';
    if (quantity <= 10) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  // Helper function to get quantity text color
  const getQuantityClass = (quantity: number) => {
    if (quantity === 0) return 'text-red-600 font-medium';
    if (quantity <= 10) return 'text-amber-600 font-medium';
    return 'text-foreground';
  };

  // Helper function to get status text based on quantity
  const getStatus = (quantity: number) => {
    if (quantity === 0) return 'Out of Stock';
    if (quantity <= 10) return 'Low Stock';
    return 'In Stock';
  };

  // Check if a product is expired or expiring soon
  const checkExpiryStatus = (product: Product) => {
    if (!product.expiryDate) return { isExpired: false, isExpiringSoon: false, daysUntilExpiry: undefined };
    
    const expiryDate = new Date(product.expiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const timeDiff = expiryDate.getTime() - today.getTime();
    const daysUntilExpiry = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    return {
      isExpired: timeDiff < 0,
      isExpiringSoon: daysUntilExpiry >= 0 && daysUntilExpiry <= 7,
      daysUntilExpiry
    };
  };

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setIsLoading(true);
        const products = await inventoryService.getAll();
        
        const inventoryWithStatus = products.map(product => {
          const { isExpired, isExpiringSoon, daysUntilExpiry } = checkExpiryStatus(product);
          
          return {
            ...product,
            unit: determineUnit(product.name),
            isExpired,
            isExpiringSoon,
            daysUntilExpiry
          };
        });
        
        setInventory(inventoryWithStatus);
        setError(null);
      } catch (err) {
        console.error('Error fetching inventory:', err);
        setError('Failed to load inventory. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInventory();
  }, []);


  
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (showExpired) {
      return matchesSearch && item.isExpired;
    }
    return matchesSearch && item.quantity > 0; // Only show in-stock items if not showing expired
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading inventory...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-8 p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowExpired(!showExpired)}
            className={`flex items-center px-3 py-1.5 text-sm rounded-md ${
              showExpired 
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <AlertTriangle className="h-4 w-4 mr-1.5" />
            {showExpired ? 'Show All Items' : 'Show Expired Items'}
          </button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>Current Inventory</CardTitle>
            <div className="w-full md:w-64">
              <Input
                placeholder="Search inventory..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInventory.length > 0 ? (
                filteredInventory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="capitalize">{item.category}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span className={getQuantityClass(item.quantity)}>
                          {item.quantity} {item.unit}
                        </span>
                        {item.expiryDate && (
                          <span className={`text-xs mt-1 ${
                            item.isExpired 
                              ? 'text-red-500' 
                              : item.isExpiringSoon 
                                ? 'text-amber-500' 
                                : 'text-muted-foreground'
                          }`}>
                            {item.isExpired ? (
                              <span className="flex items-center">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Expired
                              </span>
                            ) : item.isExpiringSoon ? (
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                Expires in {item.daysUntilExpiry} {item.daysUntilExpiry === 1 ? 'day' : 'days'}
                              </span>
                            ) : (
                              <span>Expires {new Date(item.expiryDate).toLocaleDateString()}</span>
                            )}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(item.quantity || 0)}`}>
                        {getStatus(item.quantity || 0)}
                      </span>
                    </TableCell>
                    <TableCell>{item.lastUpdated ? new Date(item.lastUpdated).toLocaleDateString() : 'N/A'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No inventory items found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}