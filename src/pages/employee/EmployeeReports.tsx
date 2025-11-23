import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { inventoryService } from "@/services/storage";
import { AlertTriangle, Package, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  expiryDate: string;
  price: number;
}

const EmployeeReports = () => {
  const [activeTab, setActiveTab] = useState<'expired' | 'expiring'>('expiring');
  const [loading, setLoading] = useState(true);
  const [expiredItems, setExpiredItems] = useState<Record<string, InventoryItem[]>>({});
  const [expiringItems, setExpiringItems] = useState<InventoryItem[]>([]);

  useEffect(() => {
    const fetchData = () => {
      try {
        const now = new Date();
        const items = inventoryService.getAll() as any[];

        // Process expired items
        const expired: Record<string, InventoryItem[]> = {};
        const expiring: InventoryItem[] = [];

        items.forEach(item => {
          if (!item.expiryDate) return;
          
          const expiryDate = new Date(item.expiryDate);
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          // Expired items
          if (expiryDate < now) {
            const monthYear = expiryDate.toLocaleString('default', { month: 'long', year: 'numeric' });
            if (!expired[monthYear]) expired[monthYear] = [];
            
            expired[monthYear].push({
              id: item.id,
              name: item.name,
              category: item.category || 'Uncategorized',
              quantity: item.quantity,
              expiryDate: item.expiryDate,
              price: item.price || 0
            });
          } 
          // Expiring soon (next 7 days)
          else if (daysUntilExpiry <= 7 && daysUntilExpiry >= 0) {
            expiring.push({
              id: item.id,
              name: item.name,
              category: item.category || 'Uncategorized',
              quantity: item.quantity,
              expiryDate: item.expiryDate,
              price: item.price || 0
            });
          }
        });

        setExpiredItems(expired);
        setExpiringItems(expiring);
      } catch (error) {
        console.error('Error fetching report data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const monthYears = Object.keys(expiredItems).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Inventory Reports</h1>
        <p className="text-muted-foreground">
          Track inventory status and expiry dates
        </p>
      </div>

      <div className="flex space-x-2 overflow-x-auto pb-2">
        <Button
          variant={activeTab === 'expired' ? 'default' : 'outline'}
          onClick={() => setActiveTab('expired')}
          className="whitespace-nowrap"
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          Expired Items
        </Button>
        <Button
          variant={activeTab === 'expiring' ? 'default' : 'outline'}
          onClick={() => setActiveTab('expiring')}
          className="whitespace-nowrap"
        >
          <Clock className="h-4 w-4 mr-2" />
          Expiring Soon
        </Button>
      </div>

      {activeTab === 'expired' ? (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
            Expired Inventory
          </h2>
          
          {monthYears.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No expired items found</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  All your inventory items are currently valid.
                </p>
              </CardContent>
            </Card>
          ) : (
            monthYears.map(monthYear => (
              <Card key={monthYear}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">{monthYear}</CardTitle>
                    <div className="text-sm text-muted-foreground">
                      {expiredItems[monthYear].length} items
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {expiredItems[monthYear].map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-md">
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.quantity} pcs • {item.category}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold flex items-center">
            <Clock className="h-5 w-5 mr-2 text-amber-500" />
            Items Expiring Soon
          </h2>
          
          {expiringItems.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <h3 className="text-lg font-medium">No items expiring soon</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  No items are expiring in the next 7 days.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {expiringItems.map(item => {
                    const expiryDate = new Date(item.expiryDate);
                    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    
                    return (
                      <div key={item.id} className="flex items-center justify-between p-4 hover:bg-muted/50">
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.quantity} pcs • {item.category}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {expiryDate.toLocaleDateString()}
                          </div>
                          <div className={`text-sm ${
                            daysUntilExpiry <= 3 ? 'text-red-500' : 'text-amber-500'
                          }`}>
                            {daysUntilExpiry === 0 
                              ? 'Expires today!'
                              : daysUntilExpiry === 1
                                ? 'Expires tomorrow'
                                : `Expires in ${daysUntilExpiry} days`
                            }
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default EmployeeReports;
